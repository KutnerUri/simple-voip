import { Voip } from "./Voip";
import "./index.css";

export function App() {
  return (
    <div className="relative z-10 mx-auto max-w-7xl p-8 text-center">
      <h1 className="my-4 text-5xl leading-tight font-bold">One Fish</h1>
      <Voip />
    </div>
  );
}

export default App;
