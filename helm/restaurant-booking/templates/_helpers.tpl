{{/*
Expand the name of the chart.
*/}}
{{- define "restaurant-booking.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "restaurant-booking.fullname" -}}
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
{{- define "restaurant-booking.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "restaurant-booking.labels" -}}
helm.sh/chart: {{ include "restaurant-booking.chart" . }}
{{ include "restaurant-booking.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "restaurant-booking.selectorLabels" -}}
app.kubernetes.io/name: {{ include "restaurant-booking.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "restaurant-booking.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "restaurant-booking.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
PostgreSQL connection string
*/}}
{{- define "restaurant-booking.postgresUrl" -}}
postgresql://{{ .Values.postgresql.auth.username }}:{{ .Values.postgresql.auth.password }}@{{ .Release.Name }}-postgresql:5432/{{ .Values.postgresql.auth.database }}
{{- end }}

{{/*
MongoDB connection string
*/}}
{{- define "restaurant-booking.mongoUrl" -}}
mongodb://{{ .Values.mongodb.auth.username }}:{{ .Values.mongodb.auth.password }}@{{ .Release.Name }}-mongodb:27017
{{- end }}

{{/*
Redis connection string
*/}}
{{- define "restaurant-booking.redisUrl" -}}
redis://{{ .Release.Name }}-redis-master:6379
{{- end }}
