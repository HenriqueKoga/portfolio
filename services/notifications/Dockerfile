FROM golang:1.22

WORKDIR /app

COPY ./src/go.mod ./go.mod
COPY ./src/go.sum ./go.sum

RUN go mod download

COPY ./src .

RUN go build -o main ./cmd

CMD ["./main"]
