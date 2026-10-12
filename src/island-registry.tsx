import type { ComponentType } from "react";
import { HandleSim, HandleTry } from "./sim/HandleSim";
import { InviteLanding, ProfileLanding } from "./sim/LinkPages";
import { WaitlistForm } from "./sim/WaitlistForm";
import { InviterReport } from "./admin/InviterReport";
import { IdentitySim, NameTry } from "./sim/IdentitySim";
import { ScamSim, ScamTry } from "./sim/ScamSim";
import { SceneSim, TrustLevels } from "./sim/ScenePhone";
import { PixDemo } from "./sim/PixDemo";

export const ISLANDS = { ScamSim, ScamTry, IdentitySim, NameTry, HandleSim, HandleTry, ProfileLanding, InviteLanding, WaitlistForm, SceneSim, TrustLevels, InviterReport, PixDemo } as const satisfies Record<string, ComponentType<any>>;
export type IslandName = keyof typeof ISLANDS;

/** Server-rendered component that the client hydrates with the same props. */
export function Island<N extends IslandName>({ name, props }: { name: N; props: Parameters<(typeof ISLANDS)[N]>[0] }) {
  const Component = ISLANDS[name] as ComponentType<any>;
  return (
    <div data-island={name} data-props={JSON.stringify(props)}>
      <Component {...props} />
    </div>
  );
}
