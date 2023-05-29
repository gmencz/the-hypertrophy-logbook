import { useForm } from "@conform-to/react";
import { parse } from "@conform-to/zod";
import { Form, Link, useActionData, useSearchParams } from "@remix-run/react";
import type { ActionArgs } from "@remix-run/server-runtime";
import { redirect } from "@remix-run/server-runtime";
import { json } from "@remix-run/server-runtime";
import { toast } from "react-hot-toast";
import { z } from "zod";
import { ErrorMessage } from "~/components/error-message";
import { ErrorToast } from "~/components/error-toast";
import { Input } from "~/components/input";
import { SubmitButton } from "~/components/submit-button";
import { configRoutes } from "~/config-routes";
import { verifyLogin } from "~/models/user.server";
import { createStripeCheckoutSession } from "~/services/stripe/api/create-checkout";
import { createUserSession, sessionStorage } from "~/session.server";
import { generateId, useAfterPaintEffect } from "~/utils";

const schema = z.object({
  email: z
    .string({
      invalid_type_error: "Email is not valid.",
      required_error: "Email is required.",
    })
    .min(1, "Email is required.")
    .max(254, "Email must be at most 254 characters long.")
    .email("Email is not valid."),

  password: z
    .string({
      invalid_type_error: "Password is not valid.",
      required_error: "Password is required.",
    })
    .min(8, "Password must be at least 8 characters long.")
    .max(128, "Password must be at most 128 characters long."),
});

type Schema = z.infer<typeof schema>;

export async function action({ request }: ActionArgs) {
  const formData = await request.formData();
  const submission = parse(formData, { schema });

  if (!submission.value || submission.intent !== "submit") {
    return json(submission, { status: 400 });
  }

  const user = await verifyLogin(
    submission.value.email,
    submission.value.password
  );

  if (!user) {
    submission.error["form"] = "You have entered an invalid email or password.";
    return json(submission, { status: 400 });
  }

  // If the user hasn't set up their subscription yet, redirect them to the stripe checkout page.
  if (!user.subscription) {
    const sessionUrl = await createStripeCheckoutSession(
      user.id,
      user.email,
      configRoutes.auth.signIn + `?canceled_id=${generateId()}`,
      user.stripeCustomerId ?? undefined
    );

    return redirect(sessionUrl, { status: 303 });
  }

  const userSession = await createUserSession({
    request,
    userId: user.id,
  });

  return redirect(configRoutes.appRoot, {
    headers: {
      "Set-Cookie": await sessionStorage.commitSession(userSession),
    },
  });
}

export default function SignIn() {
  const lastSubmission = useActionData();
  const [form, { email, password }] = useForm<Schema>({
    id: "sign-in",
    lastSubmission,
    onValidate({ formData }) {
      return parse(formData, { schema });
    },
  });

  const [searchParams] = useSearchParams();
  const canceledId = searchParams.get("canceled_id");
  useAfterPaintEffect(() => {
    if (canceledId) {
      toast.custom(
        (t) => (
          <ErrorToast
            t={t}
            title="Free trial canceled"
            description="Your free trial registration has been canceled."
          />
        ),
        { duration: 5000, position: "top-center", id: canceledId }
      );
    }
  }, [canceledId]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-sm space-y-10">
        <div>
          <img className="mx-auto h-10 w-auto" src="/logo.png" alt="Sculp" />
          <h2 className="mt-8 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <Form method="POST" {...form.props}>
          <div className="relative mb-2 -space-y-px rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-0 z-10 rounded-md ring-1 ring-inset ring-gray-300" />

            <Input
              config={email}
              hideLabel
              autoComplete="email"
              type="email"
              label="Email"
              hideErrorMessage
              placeholder="Email"
              className="relative rounded-b-none ring-1 ring-inset ring-gray-100 focus:z-10 sm:leading-6"
            />

            <Input
              config={password}
              hideLabel
              type="password"
              label="Password"
              hideErrorMessage
              placeholder="Password"
              className="relative rounded-t-none ring-1 ring-inset ring-gray-100 focus:z-10 sm:leading-6"
            />
          </div>

          {email.error || password.error ? (
            <ul className="flex flex-col">
              {email.error ? (
                <li>
                  <ErrorMessage>{email.error}</ErrorMessage>
                </li>
              ) : null}

              {password.error ? (
                <li>
                  <ErrorMessage>{password.error}</ErrorMessage>
                </li>
              ) : null}
            </ul>
          ) : null}

          {lastSubmission?.error.form ? (
            <p className="mt-4 text-sm text-red-500" role="alert">
              {lastSubmission?.error.form}
            </p>
          ) : null}

          <div className="my-6 flex items-center justify-between">
            <div className="text-sm leading-6">
              <Link
                to={configRoutes.auth.forgotPassword}
                className="font-semibold text-orange-600 hover:text-orange-500"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <SubmitButton text="Sign in" />
        </Form>

        <p className="text-center text-sm leading-6 text-gray-500">
          Not a member?{" "}
          <Link
            to={configRoutes.auth.getStarted}
            className="font-semibold text-orange-600 hover:text-orange-500"
          >
            Start a 30-day free trial
          </Link>
        </p>
      </div>
    </div>
  );
}
