package com.campus.backend;

import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.core.MongoTemplate;

@SpringBootApplication
public class BackendApplication {

	private static final Logger log = LoggerFactory.getLogger(BackendApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(BackendApplication.class, args);
	}

	@Bean
	CommandLineRunner startupStatusLogger(MongoTemplate mongoTemplate) {
		return args -> {
			log.info("Backend is working and started successfully.");
			try {
				Document pingResult = mongoTemplate.executeCommand("{ ping: 1 }");
				log.info("MongoDB connected successfully. Ping response: {}", pingResult.toJson());
			}
			catch (Exception ex) {
				log.error("MongoDB connection check failed: {}", ex.getMessage());
			}
		};
	}

}
