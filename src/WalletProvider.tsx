import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Network } from "@aptos-labs/ts-sdk";

const queryClient = new QueryClient();

interface Props { children: ReactNode; }

export function WalletProvider({ children }: Props) {
  return (
    <QueryClientProvider client={queryClient}>
      <AptosWalletAdapterProvider
        autoConnect={true}
        dappConfig={{ network: Network.TESTNET }}
        onError={(error: any) => console.error("Wallet error:", error)}
      >
        {children}
      </AptosWalletAdapterProvider>
    </QueryClientProvider>
  );
}
