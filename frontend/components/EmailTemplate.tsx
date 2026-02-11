import {EmailTemplate as Template} from "@daveyplate/better-auth-ui/server";
import {FAVICON_URL} from "~/lib/constants";
import {env} from "~/env/server";


type EmailTemplateProps = {
    name: string;
    invitationId: string;
}


export default function EmailTemplate({name, invitationId}: EmailTemplateProps) {

    return Template({
            action: "Accept Invitation",
            content: (
                <>
                    <p>
                        {`Hello ${name} 👋,`}
                    </p>
                    <p>
                        You&#39;ve been invited to join the SuperPlay Validation Platform.
                    </p>
                    <p>
                        Click the button below to accept the invitation and set up your account.
                    </p>
                </>
            ),
            heading: "SuperPlay Validation Platform Invitation",
            siteName: "SuperPlay Validation Platform",
            baseUrl: env.BETTER_AUTH_URL,
            url: `${env.BETTER_AUTH_URL}/auth/sign-in?redirectTo=/api/accept-invitation?invitationId=${invitationId}`,
            imageUrl: FAVICON_URL,

        },
    )
}