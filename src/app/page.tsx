import { DashboardProvider } from "@/context/dashboard-context";
import { VoiceInterface } from "@/components/voice/VoiceInterface";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function Home() {
  return (
    <DashboardProvider>
      <VoiceInterface>
        <DashboardView />
      </VoiceInterface>
    </DashboardProvider>
  );
}
