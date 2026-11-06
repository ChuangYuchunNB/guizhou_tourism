package com.travel.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.travel.dao.SpotDao;
import com.travel.model.Spot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

/**
 * 首次启动时若 spot 表为空，则从 classpath:spots-seed.json 种子 20 个示例景区。
 * 幂等：表非空时直接跳过，不覆盖管理员已增删的数据。
 * 必须在 SchemaMigrator / DataInitializer 之后执行（@Order(3)），确保表已存在。
 */
@Component
@Order(3)
public class SpotSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(SpotSeeder.class);

    private final SpotDao spotDao;
    private final ObjectMapper objectMapper;

    public SpotSeeder(SpotDao spotDao, ObjectMapper objectMapper) {
        this.spotDao = spotDao;
        this.objectMapper = objectMapper;
    }

    @Override
    public void run(String... args) {
        if (spotDao.count() > 0) {
            return;
        }
        try (InputStream in = new ClassPathResource("spots-seed.json").getInputStream()) {
            List<Spot> spots = objectMapper.readValue(in, new TypeReference<List<Spot>>() {});
            for (Spot spot : spots) {
                spotDao.insert(spot);
            }
            log.info("已种子 {} 个示例景区", spots.size());
        } catch (Exception e) {
            log.warn("种子景区失败，spot 表将保持为空：{}", e.getMessage());
        }
    }
}
