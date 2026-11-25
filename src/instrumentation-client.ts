import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "./sentry.shared";

// Sem gravação de sessão (replay): não queremos capturar o que as pessoas digitam nos currículos.
Sentry.init(sentryOptions);
