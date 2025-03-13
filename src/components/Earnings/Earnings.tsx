import React, { useEffect, useRef, useState } from "react";
import fetchCompanyLogos from "../../services/fetchCompanyLogos";
import fetchEarningsData from "../../services/fetchEarningsData";
import ew_logo from "./assests/ew_logo.png";
import "./Earnings.css";
import "./Earnings.model";
import { EarningsModel } from "./Earnings.model";

const Earnings: React.FC = () => {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const [rowData, setRowData] = useState<EarningsModel[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const fetchData = async () => {
      const earnings = await fetchEarningsData();
      const tickers = earnings.map((company) => company.ticker).filter(Boolean);
      const logos = await fetchCompanyLogos(tickers);

      const dataWithLogos = earnings.map((company) => ({
        ...company,
        logoUrl: logos[company.ticker] || "default_logo.svg",
      }));

      const filteredData = dataWithLogos.filter(company => {
        const date = new Date(company.date);
        const day = date.getDay();
        return (
          date.getMonth() === 2 && // Explicitly filtering data for March
          day >= 1 && day <= 5 // Explicitly filtering data for weekdays only
        );
      });

      setRowData(filteredData);
    };

    fetchData();
  }, []);

  useEffect(() => {
    getFirstMondayOfMonth(rowData[0]?.date);
  }, [rowData])


  // Group data by day
  const groupedData: Record<string, EarningsModel[]> = rowData.reduce((acc, company) => {
    const date = new Date(company.date);
    const dayName = days[date.getDay()]; // Convert date to day name

    acc[dayName] = acc[dayName] || [];
    acc[dayName].push(company);
    return acc;
  }, {} as Record<string, EarningsModel[]>);

  const getFirstMondayOfMonth = (fromDate: string) => {
    let date = new Date(fromDate);
    date.setDate(1);
    date.setDate(date.getDate() + ((8 - date.getDay()) % 7));

    if (!isNaN(new Date(date).getTime())) {
      setStartDate(date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }));
    } else {
      setStartDate('');
    }
  };

  return (
    <div className="earnings-container">
      <div className="earnings-header-container">
        <div>
          <img src={ew_logo} alt="Logo" width="300" />;
        </div>
        <div className="earnings-title">
          <h2>Most Anticipated Earnings Releases</h2>
          <div className="earnings-sub-title">
            for the week beginning
          </div>
          <h2 className="m-0">{startDate}</h2>
        </div>
      </div>
      <div className="earnings-grid">
        {days.splice(1, 5).map((day) => (
          <div key={day} className="earnings-column">
            <h3 className="earnings-day">{day}</h3>
            <div className="earnings-content">
              {groupedData[day]?.map((company) => (
                <div key={company.ticker} className="earnings-item">
                  <p className="earnings-ticker">{company.ticker}</p>
                  <a href={`https://www.benzinga.com/quote/${company.ticker}`} target="_blank" rel="noopener noreferrer">
                    <img src={company.logoUrl} alt={company.ticker} className="earnings-logo" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};

export default Earnings;
