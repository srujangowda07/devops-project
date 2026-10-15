{{/*
Expand the name of the chart.
*/}}
{{- define "cloudpulse.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited to this (by the DNS naming spec).
If release name contains chart name it will be used as a full name.
*/}}
{{- define "cloudpulse.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "cloudpulse.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "cloudpulse.labels" -}}
helm.sh/chart: {{ include "cloudpulse.chart" . }}
{{ include "cloudpulse.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "cloudpulse.selectorLabels" -}}
app.kubernetes.io/name: {{ include "cloudpulse.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Frontend selector labels
*/}}
{{- define "cloudpulse.frontend.selectorLabels" -}}
{{ include "cloudpulse.selectorLabels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Frontend labels
*/}}
{{- define "cloudpulse.frontend.labels" -}}
{{ include "cloudpulse.labels" . }}
app.kubernetes.io/component: frontend
{{- end }}

{{/*
Backend selector labels
*/}}
{{- define "cloudpulse.backend.selectorLabels" -}}
{{ include "cloudpulse.selectorLabels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
Backend labels
*/}}
{{- define "cloudpulse.backend.labels" -}}
{{ include "cloudpulse.labels" . }}
app.kubernetes.io/component: backend
{{- end }}

{{/*
PostgreSQL selector labels
*/}}
{{- define "cloudpulse.postgresql.selectorLabels" -}}
{{ include "cloudpulse.selectorLabels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{/*
PostgreSQL labels
*/}}
{{- define "cloudpulse.postgresql.labels" -}}
{{ include "cloudpulse.labels" . }}
app.kubernetes.io/component: postgresql
{{- end }}

{{/*
PostgreSQL hostname
*/}}
{{- define "cloudpulse.postgresql.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "cloudpulse.fullname" .) }}
{{- else }}
{{- .Values.database.host }}
{{- end }}
{{- end }}

{{/*
Secret name
*/}}
{{- define "cloudpulse.secretName" -}}
{{- if .Values.database.existingSecret }}
{{- .Values.database.existingSecret }}
{{- else }}
{{- printf "%s-secret" (include "cloudpulse.fullname" .) }}
{{- end }}
{{- end }}

{{/*
Database URL connection string
*/}}
{{- define "cloudpulse.databaseUrl" -}}
{{- $user := .Values.postgresql.auth.username }}
{{- $password := .Values.postgresql.auth.password }}
{{- $host := include "cloudpulse.postgresql.host" . }}
{{- $port := .Values.postgresql.service.port }}
{{- $db := .Values.postgresql.auth.database }}
{{- printf "postgresql+psycopg://%s:%s@%s:%v/%s" $user $password $host $port $db }}
{{- end }}

{{/*
Prometheus selector labels
*/}}
{{- define "cloudpulse.prometheus.selectorLabels" -}}
{{ include "cloudpulse.selectorLabels" . }}
app.kubernetes.io/component: prometheus
{{- end }}

{{/*
Prometheus labels
*/}}
{{- define "cloudpulse.prometheus.labels" -}}
{{ include "cloudpulse.labels" . }}
app.kubernetes.io/component: prometheus
{{- end }}

{{/*
Grafana selector labels
*/}}
{{- define "cloudpulse.grafana.selectorLabels" -}}
{{ include "cloudpulse.selectorLabels" . }}
app.kubernetes.io/component: grafana
{{- end }}

{{/*
Grafana labels
*/}}
{{- define "cloudpulse.grafana.labels" -}}
{{ include "cloudpulse.labels" . }}
app.kubernetes.io/component: grafana
{{- end }}
