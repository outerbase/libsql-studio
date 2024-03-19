import { env } from "@/env";
import { decrypt } from "@/lib/encryption";
import withDatabaseOperation from "@/lib/with-database-ops";
import { createClient } from "@libsql/client/web";
import { NextResponse } from "next/server";

export const runtime = "edge";

export const POST = withDatabaseOperation<{
  sql: string;
  args: (string | number)[];
}>(async function ({ permission, database, body }) {
  if (!permission.canExecuteQuery) {
    return NextResponse.json(
      {
        error: "No permission to execute query",
      },
      { status: 500 }
    );
  }

  const key = Buffer.from(env.ENCRYPTION_KEY, "base64");
  const url = database.host ?? "";
  const token = decrypt(key, database.token ?? "");

  const client = createClient({
    url,
    authToken: token,
  });

  try {
    return NextResponse.json({
      data: await client.execute({ sql: body.sql, args: body.args ?? [] }),
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message });
  }
});
