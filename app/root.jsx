import { json } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from '@remix-run/react'

export const meta = () => ({
  charset: 'utf-8',
  title: ' MyTokenExchange',
  viewport: 'width=device-width,initial-scale=1',
})

export const links = () => {
  return [
    {
      rel: 'stylesheet',
      href: 'https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css',
    },
    {
      rel: 'stylesheet',
      href: 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.0-beta1/dist/css/bootstrap.min.css',
    },
  ]
}

export async function loader() {
  return json({
    ENV: {
      CONTRACT_ADDRESS_ERC20: process.env.CONTRACT_ADDRESS_ERC20,
      CONTRACT_ADDRESS_EXCHANGE: process.env.CONTRACT_ADDRESS_EXCHANGE,
      INFURA_ID: process.env.INFURA_ID,
    },
  })
}

export default function App() {
  const data = useLoaderData()
  return (
    <html lang="en">
      <head>
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}
