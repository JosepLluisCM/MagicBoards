import { useState } from "react";
import reactLogo from "../../assets/icons/react.svg";
import viteLogo from "/vite.svg";
import { fetchData } from "../../api/services/test/testApi";
import "../../styles/index.css";

function App() {
  const [data, setData] = useState<Record<string, unknown> | null>(null); // Use a more ambiguous
  const [loading, setLoading] = useState(false); // State for loading status
  const [error, setError] = useState<string | null>(null); // State for handling errors

  const handleClick = async () => {
    setLoading(true); // Set loading state
    setError(null); // Reset error state

    try {
      const fetchedData = await fetchData(); // Fetch the data using your fetchData function
      setData(fetchedData); // Set the data in the state
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
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={handleClick}>Fetch Data</button>
        {loading && <p>Loading...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        {data && (
          <div>
            <pre>{JSON.stringify(data, null, 2)}</pre>{" "}
            {/* Display the fetched data */}
          </div>
        )}
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  );
}

export default App;
