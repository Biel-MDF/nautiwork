-- Notificação vira link para a página que resolve o aviso
ALTER TABLE "Notification" ADD COLUMN "link" TEXT;

-- Demonstração: avisos com link nas contas demo (ids fixos, não duplica; sem contas demo, não faz nada)
INSERT INTO "Notification" ("id", "userId", "title", "body", "link", "createdAt")
SELECT 'demo_nt_carla_ck', u."id", 'Como estão seus 30 dias?', 'Uma pergunta rápida sobre o trabalho em Farol Saúde. Sua resposta é só sua; a empresa só fica sabendo se você pedir uma conversa.', '/checkin/demo_ck_carla_CANDIDATE', now() - interval '1 day'
FROM "User" u WHERE u."email" = 'carla@demo.nautiwork.test' AND EXISTS (SELECT 1 FROM "HireCheckin" WHERE "id" = 'demo_ck_carla_CANDIDATE')
UNION ALL
SELECT 'demo_nt_farol_ck', u."id", '30 dias de Carla Mendes', 'Como está a pessoa contratada para "Designer de Produto"? Leva um minuto.', '/checkin/demo_ck_carla_COMPANY', now() - interval '1 day'
FROM "User" u WHERE u."email" = 'farol@demo.nautiwork.test' AND EXISTS (SELECT 1 FROM "HireCheckin" WHERE "id" = 'demo_ck_carla_COMPANY')
UNION ALL
SELECT 'demo_nt_ana_rej', u."id", 'Candidatura atualizada', 'Sua candidatura para "Desenvolvedor(a) Mobile React Native" passou para a etapa "Rejeitada". Motivo informado pela empresa: faltaram habilidades pedidas na vaga (React Native). Veja em Candidaturas os cursos gratuitos sugeridos.', '/candidate/applications', now() - interval '4 days'
FROM "User" u WHERE u."email" = 'ana@demo.nautiwork.test' AND EXISTS (SELECT 1 FROM "JobApplication" WHERE "id" = 'demo_app_ana_rejected')
UNION ALL
SELECT 'demo_nt_ana_proj', u."id", 'Projeto confirmado', 'Profa. Helena Rocha confirmou o projeto "Mural de vagas da escola". Ele aparece como confirmado no seu currículo.', '/candidate/resume', now() - interval '5 days'
FROM "User" u WHERE u."email" = 'ana@demo.nautiwork.test' AND EXISTS (SELECT 1 FROM "Project" WHERE "id" = 'demo_proj_ana')
ON CONFLICT ("id") DO NOTHING;
