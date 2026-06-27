import { Button } from "@web/components/ui/button";
import { api } from "@web/lib/api";
import React from "react";

function App() {
  React.useEffect(() => {
    api.health.$get().then((res) => res.text().then((text) => console.log));
  }, []);

  return (
    <main className="w-screen h-screen flex items-center justify-center">
      <Button>Butão</Button>
    </main>
  );
}

export default App;
