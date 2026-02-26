import { getTeamBySlug, getTeamSlugs } from "~/actions";
import { ProtectedPage } from "~/components/auth";
import NewEventDialog from "~/components/NewEventDialog";

type Params = {
  teamSlug: string;
};

type PageProps = {
  params: Promise<Params>;
};

export async function generateStaticParams() {
  const { data, error } = await getTeamSlugs();

  if (error) {
    console.error(
      "Error fetching event types with team slugs for static params:",
      error,
    );
    return [];
  }

  return data?.map((teamSlug) => ({ teamSlug })) || [];
}

export default async function Home({ params }: PageProps) {
  const { teamSlug } = await params;

  const { data: team, error } = await getTeamBySlug(teamSlug);

  if (error || !team) {
    console.error(`Error fetching team details for team ${teamSlug}:`, error);
    return (
      <ProtectedPage>
        <div className="flex min-h-screen justify-center bg-background py-12 px-4">
          <div className="w-full max-w-4xl">
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Team Not Found
            </h4>
            <p className="leading-7 [&:not(:first-child)]:mt-6">
              The team you are looking for does not exist or you do not have
              access to it. Please check the URL or contact your administrator
              for assistance.
            </p>
          </div>
        </div>
      </ProtectedPage>
    );
  }

  return (
    <ProtectedPage>
      <div className="flex min-h-screen justify-center bg-background py-12 px-4">
        <div className="w-full max-w-4xl">
          <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
            Welcome to the Event Validation Platform
          </h4>
          <p className="leading-7 [&:not(:first-child)]:mt-6">
            This platform allows you to create and manage validation rules for
            various event types. Use the sidebar to navigate through existing
            validations or create new ones.
          </p>
        </div>
      </div>
      <NewEventDialog team={team} />
    </ProtectedPage>
  );
}
