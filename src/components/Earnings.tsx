import React, { useState, useEffect, useRef } from "react";
import { AgGridReact } from "ag-grid-react";
import { ColDef, ICellRendererParams } from "ag-grid-community";
import { ClientSideRowModelModule, ValidationModule } from "ag-grid-community";
import { ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

interface CompanyEarnings {
  ticker: string;
  name: string;
  date: string;
  logoUrl?: string | null;
}

const fetchEarningsData = async (): Promise<CompanyEarnings[]> => {
  try {
    const response = await fetch(
      "https://api.benzinga.com/api/v2.1/calendar/earnings?token=f090a778d74f4450a11ad417ad72740c",
      {
        headers: { "Accept": "application/xml" }
      }
    );
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, "text/xml");

    const items = Array.from(xmlDoc.getElementsByTagName("item"));
    return items.map((item) => ({
      ticker: item.getElementsByTagName("ticker")[0]?.textContent || "",
      name: item.getElementsByTagName("name")[0]?.textContent || "",
      date: item.getElementsByTagName("date")[0]?.textContent || "",
    }));
  } catch (error) {
    console.error("fetchEarningsData Error:", error);
    return [];
  }
};

const fetchCompanyLogos = async (tickers: string[]): Promise<Record<string, string>> => {
  try {
    if (tickers.length === 0) return {};

    const response = await fetch(
      `https://api.benzinga.com/api/v2/logos/search?token=f090a778d74f4450a11ad417ad72740c&search_keys=${tickers.join(",")}&search_keys_type=symbol&fields=mark_vector_light`,
      {
        headers: { "Accept": "application/json" }
      }
    );

    if (!response.ok) {
      throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.data || !Array.isArray(data.data)) {
      throw new Error("Invalid response format");
    }

    return data.data.reduce((acc: Record<string, string>, company: any) => {
      if (company.search_key && company.files?.mark_vector_light) {
        acc[company.search_key] = company.files.mark_vector_light;
      }
      return acc;
    }, {});
  } catch (error) {
    console.error("fetchCompanyLogos Error:", error);
    return {};
  }
};

const Earnings: React.FC = () => {
  const [rowData, setRowData] = useState<CompanyEarnings[]>([]);
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
        return date.getMonth() === 2 && date.getDate() >= 1 && date.getDate() <= 31;
      });

      setRowData(filteredData);
    };

    fetchData();
  }, []);

  const columnDefs: ColDef[] = [
    {
      headerName: "Logo",
      field: "logoUrl",
      cellRenderer: (params: ICellRendererParams) => (
        <img src={params.value} alt="logo" width="20" height="20" />
      ),
    },
    { headerName: "Company Name", field: "name" },
    { headerName: "Earnings Date", field: "date" },
  ];

  return (
    <div className="ag-theme-alpine" style={{ height: 600, width: "100%" }}>
      <AgGridReact rowData={rowData} columnDefs={columnDefs} rowModelType="clientSide" />
    </div>
  );
};

export default Earnings;
