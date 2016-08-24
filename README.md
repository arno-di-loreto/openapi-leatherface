# README #

# OpenAPI Leatherface

Utilities to cut out and assemble OpenAPI specifications.

# Installation

- clone the repository
- cd openapi-leatherface
- npm install -g

# Chainsaw
Cuts out some limbs (operations) from an OpenAPI specification and create a new specification with the selected elements.
The new specification will only contained the elements required by the selected limbs.

## Usage

```shell
openapi-leatherface chainsaw <OpenAPI filename or url> -o <output filename> -f <format: json or yaml> <limbs>
```

Limbs are elements to cut out from the OpenAPI specification:

- a tag name `tag`: All operation using this tag will be cut out
- a path `/a/path`: All paths operation will be cuts out
- an operation `get /path`: The operation wil be cut out

## Examples using Clarify API

### Tag search
```shell
openapi-leatherface chainsaw "https://api.apis.guru/v2/specs/clarify.io/1.1.0/swagger.yaml" \
  -o clarify-tag-search.yaml \
  -f yaml \
  search
```

### Operation delete /v1/bundles/{bundle_id}/tracks/{track_id}
```shell
openapi-leatherface chainsaw "https://api.apis.guru/v2/specs/clarify.io/1.1.0/swagger.yaml" \
  -o clarify-operation-delete-track.yaml \
  -f yaml \
  "delete /v1/bundles/{bundle_id}/tracks/{track_id}"
```

### Path /v1/bundles
```shell
openapi-leatherface chainsaw "https://api.apis.guru/v2/specs/clarify.io/1.1.0/swagger.yaml" \
  -o clarify-path-bundle.yaml \
  -f yaml \
  "/v1/bundles"
```

### The three limbs together 
```shell
openapi-leatherface chainsaw "https://api.apis.guru/v2/specs/clarify.io/1.1.0/swagger.yaml" \
  -o clarify-multi.yaml \
  -f yaml \
  "/v1/bundles" search "delete /v1/bundles/{bundle_id}/tracks/{track_id}"
```
