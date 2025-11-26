"use client";

import { useState } from "react";

import { apiClient } from "@/lib/api/api-client";
import { Button } from "@/components/button";
import { Text } from "@/components/text";

export default function Health() {
  const [response, setResponse] = useState<string | null>(null);

  const handleHealth = async () => {
    const res = await apiClient.api.health.$get();
    const result = await res.json();
    setResponse(JSON.stringify(result, null, 2));
  };

  return (
    <>
      <Text variant="h1">Health</Text>
      <Text variant="subtitle">
        Check the health of the API and the underlying services.
      </Text>
      <Button onClick={handleHealth}>Check health</Button>
      <pre>{response}</pre>
    </>
  );
}
