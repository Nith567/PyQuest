export default async function handler(req, res) {
  // Get the base URL from environment or request
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                  process.env.VITE_APP_URL || 
                  'https://arbi-blocks-24va.vercel.app';

  const manifest = {
    accountAssociation: {
      header: "eyJmaWQiOjM4MjY1NCwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweDAxNDQ1OTMzRjI5MDA1NjEwOTYwQkU2MzUxMWViYTI0M0YzMTdkMkYifQ",
      payload: "eyJkb21haW4iOiJhcmJpLWJsb2Nrcy0yNHZhLnZlcmNlbC5hcHAifQ",
      signature: "MHhmYTQxNGMzZTMyNTY4NjZjODk1ZDQwYjc0ZTg0OGI5ZDMyOTg1YjkyZDY2MmM3YmQxNzIwYzUxZTg2ZTViNGI3ZGIzYzJmNzYwMWQ4ODEyYzM0ZjYzODc5YTExZjhjZWQxZTQ3ZjU5M2YzZmUzNGRkMGU4ZjU4ZTk0Y2IyNTcxYg"
    },
    frame: {
      version: "1",
      name: "PyQuest",
      iconUrl: `${baseUrl}/pyquest-icon.png`,
      homeUrl: `${baseUrl}/`,
      imageUrl: `${baseUrl}/pyquest-icon.png`,
      buttonTitle: "Launch PyQuest",
      splashImageUrl: `${baseUrl}/pyquest-icon.png`,
      splashBackgroundColor: "#7c3aed",
      webhookUrl: "https://api.neynar.com/f/app/4d455c47-492f-4014-8b69-0613c80b23f2/event"
    }
  };

  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(manifest);
}
