import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLocation,
  useRouteError,
} from "@remix-run/react";

import tailwindStylesheetUrl from "~/styles/tailwind.css";
import { getUser } from "~/session.server";
import { ErrorPage } from "./components/error-page";
import type { PropsWithChildren } from "react";
import { BackLink } from "./components/back-link";
import { Toaster } from "react-hot-toast";

export const meta: V2_MetaFunction = () => [
  {
    title: "Sculp",
    charset: "utf-8",
  },
  {
    name: "viewport",
    content: "width=device-width,initial-scale=1",
  },
  {
    name: "description",
    content: "Smart hypertrophy app for maximum muscle growth.",
  },
];

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: tailwindStylesheetUrl },
];

export const loader = async ({ request }: LoaderArgs) => {
  return json({ user: await getUser(request) });
};

export default function App() {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />

        <ScrollRestoration />
        <Scripts />
        <LiveReload />
        <Toaster position="top-right" />
        <noscript>This app requires JavaScript to be enabled</noscript>
      </body>
    </html>
  );
}

function ErrorDoc({ children }: PropsWithChildren) {
  return (
    <html lang="en" className="h-full">
      <head>
        <title>Oh no...</title>
        <Links />
      </head>
      <body className="h-full">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();

  if (isRouteErrorResponse(error)) {
    console.error("Caught route error", error);

    if (error.status === 404) {
      return (
        <ErrorDoc>
          <ErrorPage
            statusCode={error.status}
            title="Page not found"
            subtitle={`"${location.pathname}" is not a page. So sorry.`}
            action={<BackLink to="/">Back to home</BackLink>}
          />
        </ErrorDoc>
      );
    }

    if (error.status !== 500) {
      return (
        <ErrorDoc>
          <ErrorPage
            statusCode={error.status}
            title="Oh no, something did not go well."
            subtitle={`"${location.pathname}" is currently not working. So sorry.`}
            action={<BackLink to="/">Back to home</BackLink>}
          />
        </ErrorDoc>
      );
    }

    throw new Error(`Unhandled error: ${error.status}`);
  }

  console.error(`Uncaught error`, error);

  return (
    <ErrorDoc>
      <ErrorPage
        statusCode={500}
        title="Oh no, something did not go well."
        subtitle={`"${location.pathname}" is currently not working. So sorry.`}
        action={<BackLink to="/">Back to home</BackLink>}
      />
    </ErrorDoc>
  );
}
