// Use the private binding; the rooms Worker is never exposed on workers.dev.
export const onRequest: PagesFunction<Env> = (context) =>
  context.env.ROOMS_API
    ? context.env.ROOMS_API.fetch(context.request)
    : Response.json(
        { error: "Nettrom er ikke konfigurert her ennå." },
        { status: 503 },
      );
