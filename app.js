// app.js

function App() {
  const [redLeave, setRedLeave] = React.useState(false);
  const [redBase, setRedBase] = React.useState("none");
  const [blueLeave, setBlueLeave] = React.useState(false);
  const [blueBase, setBlueBase] = React.useState("none");

  const LEAVE_POINTS = 3;
  const BASE_PARTIAL_POINTS = 5;
  const BASE_FULL_POINTS = 10;
  const MOVEMENT_RP_THRESHOLD = 16;

  const scoreTeam = (leave, base) => {
    let score = 0;
    if (leave) score += LEAVE_POINTS;
    if (base === "partial") score += BASE_PARTIAL_POINTS;
    if (base === "full") score += BASE_FULL_POINTS;
    return score;
  };

  const redScore = scoreTeam(redLeave, redBase);
  const blueScore = scoreTeam(blueLeave, blueBase);
  const totalScore = redScore + blueScore;
  const gotRP = totalScore >= MOVEMENT_RP_THRESHOLD;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">FTC DECODE Board-Game Simulator</h1>

      {/* Red Alliance */}
      <div className="p-4 mb-4 bg-red-100 rounded-xl shadow">
        <h2 className="font-semibold text-lg mb-2">Red Robot</h2>
        <label className="block mb-2">
          <input
            type="checkbox"
            checked={redLeave}
            onChange={(e) => setRedLeave(e.target.checked)}
          />{" "}
          Leave
        </label>
        <label className="block">
          Base Return:
          <select
            className="ml-2 border rounded p-1"
            value={redBase}
            onChange={(e) => setRedBase(e.target.value)}
          >
            <option value="none">None</option>
            <option value="partial">Partial</option>
            <option value="full">Full</option>
          </select>
        </label>
        <p className="mt-2">Red Score: {redScore}</p>
      </div>

      {/* Blue Alliance */}
      <div className="p-4 mb-4 bg-blue-100 rounded-xl shadow">
        <h2 className="font-semibold text-lg mb-2">Blue Robot</h2>
        <label className="block mb-2">
          <input
            type="checkbox"
            checked={blueLeave}
            onChange={(e) => setBlueLeave(e.target.checked)}
          />{" "}
          Leave
        </label>
        <label className="block">
          Base Return:
          <select
            className="ml-2 border rounded p-1"
            value={blueBase}
            onChange={(e) => setBlueBase(e.target.value)}
          >
            <option value="none">None</option>
            <option value="partial">Partial</option>
            <option value="full">Full</option>
          </select>
        </label>
        <p className="mt-2">Blue Score: {blueScore}</p>
      </div>

      {/* Totals */}
      <div className="p-4 bg-green-100 rounded-xl shadow">
        <h2 className="font-semibold text-lg mb-2">Alliance Total</h2>
        <p>Total Score: {totalScore}</p>
        <p>
          Movement RP:{" "}
          <span className={gotRP ? "text-green-600 font-bold" : "text-red-600"}>
            {gotRP ? "Earned ✅" : "Not Earned ❌"}
          </span>
        </p>
      </div>
    </div>
  );
}

// Render app
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
