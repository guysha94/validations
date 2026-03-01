import {ProtectedPage} from "~/components/auth";


export default async function Home() {

    return (
        <ProtectedPage>
            <div className="flex min-h-screen justify-center bg-background py-12 px-4">
                <div className="w-full max-w-4xl">
                    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                        Welcome to the Event Validation Platform
                    </h4>
                    <p className="leading-7 not-first:mt-6">
                        This platform allows you to create and manage validation rules for
                        various event types. Use the sidebar to navigate through existing
                        validations or create new ones.
                    </p>
                </div>
            </div>
        </ProtectedPage>
    );
}
