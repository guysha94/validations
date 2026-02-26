"use client";
import { GoogleIcon } from "~/components/icons";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { useAuth } from "~/hooks/use-auth";

export default function SignInForm() {
  const { signin } = useAuth();

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
      </CardHeader>
      <CardContent></CardContent>
      <CardFooter className="flex-col gap-2">
        <Button variant="outline" className="w-full" onClick={signin}>
          <GoogleIcon />
          Login with Google
        </Button>
      </CardFooter>
    </Card>
  );
}
