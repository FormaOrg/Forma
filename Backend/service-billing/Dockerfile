FROM maven:3.9.12-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src src
RUN mvn -B clean package -DskipTests -Dmaven.wagon.http.retryHandler.count=8 -Dmaven.wagon.httpconnectionManager.ttlSeconds=120

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
RUN mkdir -p uploads
EXPOSE 8085
ENTRYPOINT ["java", "-jar", "app.jar"]
