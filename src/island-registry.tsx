import type { ComponentType } from "react";
import { HandleSim } from "./sim/HandleSim";
import { InviteLanding, ProfileLanding } from "./sim/LinkPages";
import { ConfirmEmailLanding, RecoverLanding } from "./sim/AccountLinks";
import { WaitlistForm } from "./sim/WaitlistForm";
import { PartnerForm } from "./sim/PartnerForm";
import { StaffApp } from "./admin/staff-app";
import { IdentitySim } from "./sim/IdentitySim";
import { RealVsFake, SceneReel, SceneSim, TrustLevels } from "./sim/ScenePhone";
import { PixDemo } from "./sim/PixDemo";
import { ApiMini, ArriveMini, InboxMini } from "./sim/BusinessMinis";
import { NotFound } from "./sim/NotFound";

export const ISLANDS = { SceneReel, IdentitySim, HandleSim, ProfileLanding, InviteLanding, ConfirmEmailLanding, RecoverLanding, WaitlistForm, PartnerForm, SceneSim, TrustLevels, RealVsFake, StaffApp, PixDemo, InboxMini, ApiMini, ArriveMini, NotFound } as const satisfies Record<string, ComponentType<any>>;
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
