#!/usr/bin/env bash
docker run -it --rm --env-file $ATD_CRIS_CONFIG atddocker/atd-cris-capybara /app/app-run-process-cr3.sh