const fetchCompanyLogos = async (tickers: string[]): Promise<Record<string, string>> => {
    try {
      if (tickers.length === 0) return {};
  
      const response = await fetch(
        `https://api.benzinga.com/api/v2/logos/search?token=f090a778d74f4450a11ad417ad72740c&search_keys=${tickers.join(",")}&search_keys_type=symbol&fields=mark_vector_light`,
        {
          headers: { "Accept": "application/json" },
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
  
  export default fetchCompanyLogos;
  