package com.offlinepay.reconcile.service;

import com.offlinepay.reconcile.controller.DuplicateTransactionException;
import com.offlinepay.reconcile.dto.TransactionRequest;
import com.offlinepay.reconcile.entity.*;
import com.offlinepay.reconcile.repository.PaymentTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final PaymentTransactionRepository repository;

    @Transactional
    public PaymentTransaction createOffline(TransactionRequest request) {
        if (repository.existsByTransactionId(request.transactionId())) {
            throw new DuplicateTransactionException("Transaction ID already exists: " + request.transactionId());
        }

        return repository.save(PaymentTransaction.builder()
                .transactionId(request.transactionId())
                .customerId(request.customerId())
                .merchantId(request.merchantId())
                .amount(request.amount())
                .source(TransactionSource.OFFLINE)
                .status(TransactionStatus.QUEUED)
                .build());
    }

    public List<PaymentTransaction> getAll() {
        return repository.findAll();
    }

    public PaymentTransaction getById(String transactionId) {
        return repository.findByTransactionId(transactionId)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found: " + transactionId));
    }
}
