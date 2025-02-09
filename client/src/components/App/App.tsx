import { useState } from "react";
import { fetchData } from "../../api/services/test/testApi";
import "./App.css";

function App() {
  const [data, setData] = useState<Record<string, unknown> | null>(null); // Use a more ambiguous
  const [loading, setLoading] = useState(false); // State for loading status
  const [error, setError] = useState<string | null>(null); // State for handling errors

  const handleClick = async () => {
    setLoading(true); // Set loading state
    setError(null); // Reset error state

    try {
      const fetchedData = await fetchData(); // Fetch the data using your fetchData function
      setData(fetchedData);
      console.log(fetchedData); // Set the data in the state
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch data: ${error.message}`); // You can access the error's message
      }
      throw new Error("An unknown error occurred while fetching data");
    } finally {
      setLoading(false); // Turn off loading once the API call is finished
    }
  };

  return (
    <>
      <h1>MAGIC BOARDS</h1>
      <div className="card">
        <button onClick={handleClick}>Show BD data</button>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {data && (
          <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>{" "}
          </div>
        )}
      </div>
    </>
  );
}

export default App;
