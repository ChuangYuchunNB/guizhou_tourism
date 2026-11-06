package com.travel.service;

import com.travel.dao.SpotDao;
import com.travel.model.Spot;
import org.springframework.stereotype.Service;

import java.util.List;

/** 景区读服务（公开）。新增/删除走 AdminService。 */
@Service
public class SpotService {

    private final SpotDao spotDao;

    public SpotService(SpotDao spotDao) {
        this.spotDao = spotDao;
    }

    public List<Spot> listAll() {
        return spotDao.findAll();
    }

    public Spot getById(String id) {
        if (id == null || id.trim().isEmpty()) return null;
        return spotDao.findById(id.trim());
    }
}
