const fetchEarningsData = async () => {
    try {
      const response = await fetch(
        "https://api.benzinga.com/api/v2.1/calendar/earnings?token=f090a778d74f4450a11ad417ad72740c",
        {
          headers: { "Accept": "application/xml" },
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
  
  export default fetchEarningsData;
  