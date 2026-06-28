import Image from "next/image";
import { TEAM_MEMBERS } from "@/config/site";
import { Card, CardTitle, CardDescription } from "@/components/ui/Card";

export function OurTeamCard() {
  return (
    <Card variant="elevated" padding="md" className="bg-white">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-neutral-400">
        Our Team
      </p>
      <div className="flex items-center gap-2">
        {TEAM_MEMBERS.map((member, index) => (
          <div
            key={member.id}
            className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-white ring-1 ring-neutral-100"
            style={{ marginLeft: index > 0 ? -8 : 0, zIndex: TEAM_MEMBERS.length - index }}
          >
            <Image
              src={member.avatarUrl}
              alt={member.name}
              fill
              className="object-cover"
              sizes="40px"
            />
          </div>
        ))}
      </div>
      <CardDescription className="mt-3 leading-relaxed">
        Our design and sourcing team finds products you won&apos;t see
        anywhere else, at prices that make sense.
      </CardDescription>
    </Card>
  );
}

export function CommunityCard() {
  return (
    <Card variant="elevated" padding="md" className="bg-neutral-900 text-white">
      <CardTitle className="text-white">Join Our Community</CardTitle>
      <CardDescription className="mt-2 text-neutral-400">
        Share your sourcing wins, request hard to find items, and get early access
        to exclusive deals our team discovers.
      </CardDescription>
    </Card>
  );
}
