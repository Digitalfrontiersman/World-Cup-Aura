import { AuraFlowProvider } from "@/flow/AuraFlowProvider";
import { AuraFlow } from "@/flow/AuraFlow";

// The home experience: the whole multi-step flow, wrapped in its state provider.
export default function Home() {
  return (
    <AuraFlowProvider>
      <AuraFlow />
    </AuraFlowProvider>
  );
}
