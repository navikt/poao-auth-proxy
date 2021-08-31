# Produktområde Arbeidsoppfølging (POAO) Auth Proxy

Generisk auth proxy + innloggingstjeneste for Azure AD og ID-porten+TokenX ved bruk av 
phantom token pattern (https://curity.io/resources/learn/phantom-token-pattern).

Auth proxyen implementerer OAuth2 on-behalf-of flyten for konfigurerte proxy endepunkter 
og vil bytte ut access-token fra OIDC provideren med et nytt access-token som er scopet til en gitt backend.

## Config



## Eksempel

Opprett secrets med Google Secret Manager slik som beskrevet her: https://doc.nais.io/security/secrets/google-secrets-manager/.
Obs, husk å sette label for `env=true` på begge secrets.

Opprett en ny secret for session cookie med verdi: `SESSION_COOKIE_SECRET=<some random secure string>`.
Opprett en ny secret for redis passord med verdi: `REDIS_PASSWORD=<some random secure string>`.

NB: Navnet på secretsene må matche navnet som er brukt i yamlene nedenfor.

Bytt ut verdiene som mangler i yaml-filene nedenfor og bruk enten kubectl (`kubectl apply -f <file name>`) eller CI/CD til å opprette applikasjonene i NAIS clusteret.

```yaml
kind: Application
apiVersion: nais.io/v1alpha1
metadata:
  name: <app-name>
  namespace: <team-name>
  labels:
    team: <team-name>
spec:
  image: ghcr.io/navikt/poao-auth-proxy:<version>
  ingresses:
    - https://<app-name>.<dev/intern>.nav.no
  port: 8080
  prometheus:
    enabled: false
  liveness:
    path: /internal/alive
    initialDelay: 15
  readiness:
    path: /internal/ready
    initialDelay: 15
  replicas:
    min: 1
    max: 2
    cpuThresholdPercentage: 90
  resources:
    limits:
      cpu: "1"
      memory: 512Mi
    requests:
      cpu: 100m
      memory: 128Mi
  idporten:
    enabled: true
  tokenx:
    enabled: true
  accessPolicy:
    inbound:
      rules:
        - application: <some frontend that uses cluster service url>
    outbound:
      rules:
        - application: <app-name>-redis
  envFrom:
    - secret: amt-tiltaksarrangor-flate-auth-proxy-redis-secret
    - secret: amt-tiltaksarrangor-flate-auth-proxy-secret
  env:
    - name: APPLICATION_URL
      value: <same as ingress>
    - name: AUTH_LOGIN_PROVIDER
      value: <ID_PORTEN | AZURE_AD>
    - name: SESSION_STORAGE_STORE_TYPE
      value: REDIS
    - name: SESSION_STORAGE_REDIS_HOST
      value: <app-name>-redis
    - name: SESSION_STORAGE_REDIS_PASSWORD
      value: env:REDIS_PASSWORD
    - name: SESSION_COOKIE_DOMAIN
      value: nav.no
```

```yaml
apiVersion: "nais.io/v1alpha1"
kind: "Application"
metadata:
  name: <app-name>-redis
  namespace: <team-name>
  labels:
    team: <team-name>
spec:
  image: bitnami/redis:6.2-debian-10
  port: 6379
  replicas:
    min: 1
    max: 1
  resources:
    limits:
      cpu: "1"
      memory: 256Mi
    requests:
      cpu: 100m
      memory: 128Mi
  service:
    port: 6379
    protocol: redis
  envFrom:
  - secret: <app-name>-redis-secret
  accessPolicy:
    inbound:
      rules:
        - application: <app-name>
```
