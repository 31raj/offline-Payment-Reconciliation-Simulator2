import axios from 'axios';

// Vite proxies this path to Spring Boot during local development. Set
// VITE_API_BASE when the frontend and API are deployed to separate hosts.
export const API_BASE=import.meta.env.VITE_API_BASE||'/api';
const api=axios.create({baseURL:API_BASE,timeout:5000,headers:{'Content-Type':'application/json'}});

const time=value=>value?new Date(value).toLocaleTimeString([],{hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'}):'—';
export const toTransactionView=tx=>({...tx,id:tx.transactionId,customer:tx.customerId,merchant:tx.merchantId,amount:Number(tx.amount),time:time(tx.createdAt)});
const toLogView=log=>({...log,tx:log.transactionId,action:log.result==='FAILED'?'Failure':log.result==='DUPLICATE'?'Duplicate Detection':'Reconciliation',detail:log.reason,time:time(log.createdAt)});

export async function getTransactions(){return(await api.get('/transactions')).data.map(toTransactionView)}
export async function createTransaction(payload){
  const request={
    transactionId:payload.transactionId,
    customerId:payload.customerId||payload.customerName,
    merchantId:payload.merchantId||payload.merchantName,
    amount:payload.amount,
  };
  return toTransactionView((await api.post('/transactions',request)).data)
}
export async function syncTransactions(){return(await api.post('/sync')).data.map(toTransactionView)}
export async function getStats(){return(await api.get('/dashboard/stats')).data}
export async function getLogs(){return(await api.get('/reconciliation/logs')).data.map(toLogView)}
export async function reconcileTransaction(id,payload){
  // Older UI callers only send a serverTransactionId and amount. Retrieve the
  // local record to complete the validation contract required by Spring Boot.
  const local=(await api.get(`/transactions/${encodeURIComponent(id)}`)).data;
  const request={
    transactionId:payload.transactionId||payload.serverTransactionId||id,
    customerId:payload.customerId||local.customerId,
    merchantId:payload.merchantId||local.merchantId,
    amount:payload.amount,
  };
  return toTransactionView((await api.post(`/reconciliation/${encodeURIComponent(id)}`,request)).data)
}
export async function failTransaction(id,reason){return toTransactionView((await api.post(`/reconciliation/${encodeURIComponent(id)}/fail`,null,{params:{reason}})).data)}
export async function simulateConflict(id) {
  return toTransactionView(
    (
      await api.post(
        `/reconciliation/${encodeURIComponent(id)}/simulate-conflict`
      )
    ).data
  );
}