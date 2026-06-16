package com.jsycure.dashboard;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * 두 개의 DataSource:
 *  - dataSource(@Primary): 데이터 DB(suricata_db). 읽기 전용. MyBatis가 사용.
 *  - authDataSource: 사용자/인증 DB(dashboard_app). 읽기/쓰기. JdbcTemplate가 사용.
 * 분리 이유: 보안 로그 데이터는 절대 변경하지 않도록 읽기 전용 유지, 회원 테이블만 쓰기 허용.
 */
@Configuration
public class DataSourceConfig {

    /** 데이터 DB (읽기 전용) — MyBatis SqlSessionFactory가 @Primary 를 사용 */
    @Primary
    @Bean
    public DataSource dataSource(
            @Value("${spring.datasource.url}") String url,
            @Value("${spring.datasource.username}") String username,
            @Value("${spring.datasource.password}") String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setReadOnly(true);            // 데이터 DB는 절대 변경하지 않음
        ds.setMaximumPoolSize(5);
        ds.setConnectionTimeout(10000);
        ds.setConnectionInitSql("SET statement_timeout = 15000"); // 무거운 쿼리(풀스캔 등) 15초로 강제 종료
        ds.setPoolName("suricata-ro");
        return ds;
    }

    /** 사용자/인증 DB (읽기/쓰기) */
    @Bean
    public DataSource authDataSource(
            @Value("${app.auth.datasource.url}") String url,
            @Value("${app.auth.datasource.username}") String username,
            @Value("${app.auth.datasource.password}") String password) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(url);
        ds.setUsername(username);
        ds.setPassword(password);
        ds.setMaximumPoolSize(3);
        ds.setConnectionTimeout(10000);
        ds.setConnectionInitSql("SET statement_timeout = 15000");
        ds.setPoolName("dashboard-app-rw");
        ds.setInitializationFailTimeout(-1); // 시작 시 app DB가 잠깐 없어도 부팅은 되게(첫 사용 시 연결)
        return ds;
    }

    @Bean
    public JdbcTemplate authJdbcTemplate(@Qualifier("authDataSource") DataSource authDataSource) {
        return new JdbcTemplate(authDataSource);
    }
}
