import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Client, ManagementProduct, Quote, Order, Transaction, Mockup, Company, QuoteItem } from '@/types/management';
import { toast } from 'sonner';

interface ManagementContextType {
  // Clients
  clients: Client[];
  loadingClients: boolean;
  fetchClients: () => Promise<void>;
  addClient: (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>) => Promise<Client | null>;
  updateClient: (id: string, client: Partial<Client>) => Promise<boolean>;
  deleteClient: (id: string) => Promise<boolean>;
  
  // Products
  products: ManagementProduct[];
  loadingProducts: boolean;
  fetchProducts: () => Promise<void>;
  addProduct: (product: Omit<ManagementProduct, 'id' | 'created_at' | 'updated_at'>) => Promise<ManagementProduct | null>;
  updateProduct: (id: string, product: Partial<ManagementProduct>) => Promise<boolean>;
  deleteProduct: (id: string) => Promise<boolean>;
  
  // Quotes
  quotes: Quote[];
  loadingQuotes: boolean;
  fetchQuotes: () => Promise<void>;
  addQuote: (quote: Omit<Quote, 'id' | 'number' | 'created_at' | 'updated_at' | 'items'>, items: Omit<QuoteItem, 'id' | 'quote_id'>[]) => Promise<Quote | null>;
  updateQuote: (id: string, quote: Partial<Quote>) => Promise<boolean>;
  deleteQuote: (id: string) => Promise<boolean>;
  convertQuoteToOrder: (quoteId: string) => Promise<Order | null>;
  
  // Orders
  orders: Order[];
  loadingOrders: boolean;
  fetchOrders: () => Promise<void>;
  addOrder: (order: Omit<Order, 'id' | 'number' | 'created_at' | 'updated_at' | 'items'>, items: Omit<QuoteItem, 'id' | 'order_id'>[]) => Promise<Order | null>;
  updateOrder: (id: string, order: Partial<Order>) => Promise<boolean>;
  deleteOrder: (id: string) => Promise<boolean>;
  
  // Transactions
  transactions: Transaction[];
  loadingTransactions: boolean;
  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<Transaction | null>;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => Promise<boolean>;
  deleteTransaction: (id: string) => Promise<boolean>;
  
  // Mockups
  mockups: Mockup[];
  loadingMockups: boolean;
  fetchMockups: () => Promise<void>;
  addMockup: (mockup: Omit<Mockup, 'id' | 'created_at' | 'updated_at'>) => Promise<Mockup | null>;
  deleteMockup: (id: string) => Promise<boolean>;
  
  // Company
  company: Company | null;
  loadingCompany: boolean;
  fetchCompany: () => Promise<void>;
  updateCompany: (company: Partial<Company>) => Promise<boolean>;
}

const ManagementContext = createContext<ManagementContextType | undefined>(undefined);

const generateNumber = (prefix: string, count: number) => 
  `${prefix}${String(count).padStart(5, '0')}`;

export function ManagementProvider({ children }: { children: ReactNode }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  
  const [products, setProducts] = useState<ManagementProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loadingQuotes, setLoadingQuotes] = useState(false);
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  
  const [mockups, setMockups] = useState<Mockup[]>([]);
  const [loadingMockups, setLoadingMockups] = useState(false);
  
  const [company, setCompany] = useState<Company | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  // Clients
  const fetchClients = useCallback(async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setClients((data as Client[]) || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  }, []);

  const addClient = async (client: Omit<Client, 'id' | 'created_at' | 'updated_at'>): Promise<Client | null> => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([client])
        .select()
        .single();
      
      if (error) throw error;
      const newClient = data as Client;
      setClients(prev => [newClient, ...prev]);
      return newClient;
    } catch (error) {
      console.error('Error adding client:', error);
      toast.error('Erro ao adicionar cliente');
      return null;
    }
  };

  const updateClient = async (id: string, client: Partial<Client>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .update(client)
        .eq('id', id);
      
      if (error) throw error;
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...client } : c));
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      toast.error('Erro ao atualizar cliente');
      return false;
    }
  };

  const deleteClient = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setClients(prev => prev.filter(c => c.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
      return false;
    }
  };

  // Products - Using catalog products table
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (error) throw error;
      setProducts((data as ManagementProduct[]) || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  const addProduct = async (product: Omit<ManagementProduct, 'id' | 'created_at' | 'updated_at'>): Promise<ManagementProduct | null> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify(product),
      });
      
      if (!response.ok) throw new Error('Failed to add product');
      const newProduct = await response.json() as ManagementProduct;
      setProducts(prev => [newProduct, ...prev]);
      return newProduct;
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Erro ao adicionar produto');
      return null;
    }
  };

  const updateProduct = async (id: string, product: Partial<ManagementProduct>): Promise<boolean> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-products`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({ id, ...product }),
      });
      
      if (!response.ok) throw new Error('Failed to update product');
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...product } : p));
      return true;
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
      return false;
    }
  };

  const deleteProduct = async (id: string): Promise<boolean> => {
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const response = await fetch(`${supabaseUrl}/functions/v1/admin-products?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      setProducts(prev => prev.filter(p => p.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
      return false;
    }
  };

  // Quotes
  const fetchQuotes = useCallback(async () => {
    setLoadingQuotes(true);
    try {
      const { data: quotesData, error: quotesError } = await supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (quotesError) throw quotesError;

      // Fetch items for each quote
      const quotesWithItems = await Promise.all((quotesData || []).map(async (quote) => {
        const { data: items } = await supabase
          .from('quote_items')
          .select('*')
          .eq('quote_id', quote.id);
        return { ...quote, items: (items as QuoteItem[]) || [] } as Quote;
      }));

      setQuotes(quotesWithItems);
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoadingQuotes(false);
    }
  }, []);

  const addQuote = async (
    quote: Omit<Quote, 'id' | 'number' | 'created_at' | 'updated_at' | 'items'>,
    items: Omit<QuoteItem, 'id' | 'quote_id'>[]
  ): Promise<Quote | null> => {
    try {
      // Get ALL quote numbers and find the maximum to avoid duplicates
      const { data: allQuotes } = await supabase
        .from('quotes')
        .select('number');
      
      let maxNumber = 0;
      if (allQuotes && allQuotes.length > 0) {
        allQuotes.forEach(q => {
          const num = parseInt(q.number.replace('ORC', ''), 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        });
      }
      
      const number = generateNumber('ORC', maxNumber + 1);
      const { data, error } = await supabase
        .from('quotes')
        .insert([{ ...quote, number }])
        .select()
        .single();
      
      if (error) throw error;

      // Add items
      let insertedItems: QuoteItem[] = [];
      if (items.length > 0) {
        const itemsWithQuoteId = items.map(item => ({ ...item, quote_id: data.id }));
        const { data: itemsData } = await supabase.from('quote_items').insert(itemsWithQuoteId).select();
        insertedItems = (itemsData as QuoteItem[]) || [];
      }

      const newQuote: Quote = { ...data, items: insertedItems } as Quote;
      setQuotes(prev => [newQuote, ...prev]);
      return newQuote;
    } catch (error) {
      console.error('Error adding quote:', error);
      toast.error('Erro ao adicionar orçamento');
      return null;
    }
  };

  const updateQuote = async (id: string, quote: Partial<Quote>): Promise<boolean> => {
    try {
      const { items, ...quoteData } = quote;
      const { error } = await supabase
        .from('quotes')
        .update(quoteData)
        .eq('id', id);
      
      if (error) throw error;
      setQuotes(prev => prev.map(q => q.id === id ? { ...q, ...quote } : q));
      return true;
    } catch (error) {
      console.error('Error updating quote:', error);
      toast.error('Erro ao atualizar orçamento');
      return false;
    }
  };

  const deleteQuote = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('quotes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setQuotes(prev => prev.filter(q => q.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting quote:', error);
      toast.error('Erro ao excluir orçamento');
      return false;
    }
  };

  const convertQuoteToOrder = async (quoteId: string): Promise<Order | null> => {
    const quote = quotes.find(q => q.id === quoteId);
    if (!quote) return null;

    try {
      // Get ALL order numbers and find the maximum to avoid duplicates
      const { data: allOrders } = await supabase
        .from('orders')
        .select('number');
      
      let maxNumber = 0;
      if (allOrders && allOrders.length > 0) {
        allOrders.forEach(o => {
          const num = parseInt(o.number.replace('PED', ''), 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        });
      }
      
      const number = generateNumber('PED', maxNumber + 1);
      const orderData = {
        number,
        quote_id: quoteId,
        client_id: quote.client_id,
        client_name: quote.client_name,
        subtotal: quote.subtotal,
        discount: quote.discount,
        total: quote.total,
        notes: quote.notes,
        status: 'awaiting_payment' as const,
      };

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();
      
      if (error) throw error;

      // Copy items
      let insertedItems: QuoteItem[] = [];
      if (quote.items && quote.items.length > 0) {
        const itemsWithOrderId = quote.items.map(item => ({
          order_id: data.id,
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        }));
        const { data: itemsData } = await supabase.from('quote_items').insert(itemsWithOrderId).select();
        insertedItems = (itemsData as QuoteItem[]) || [];
      }

      // Update quote status
      await updateQuote(quoteId, { status: 'converted' });

      const newOrder: Order = { ...data, items: insertedItems } as Order;
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (error) {
      console.error('Error converting quote:', error);
      toast.error('Erro ao converter orçamento');
      return null;
    }
  };

  // Orders
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;

      // Fetch items for each order
      const ordersWithItems = await Promise.all((ordersData || []).map(async (order) => {
        const { data: items } = await supabase
          .from('quote_items')
          .select('*')
          .eq('order_id', order.id);
        return { ...order, items: (items as QuoteItem[]) || [] } as Order;
      }));

      setOrders(ordersWithItems);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const addOrder = async (
    order: Omit<Order, 'id' | 'number' | 'created_at' | 'updated_at' | 'items'>,
    items: Omit<QuoteItem, 'id' | 'order_id'>[]
  ): Promise<Order | null> => {
    try {
      // Get ALL order numbers and find the maximum to avoid duplicates
      const { data: allOrders } = await supabase
        .from('orders')
        .select('number');
      
      let maxNumber = 0;
      if (allOrders && allOrders.length > 0) {
        allOrders.forEach(o => {
          const num = parseInt(o.number.replace('PED', ''), 10);
          if (!isNaN(num) && num > maxNumber) {
            maxNumber = num;
          }
        });
      }
      
      const number = generateNumber('PED', maxNumber + 1);
      const { data, error } = await supabase
        .from('orders')
        .insert([{ ...order, number }])
        .select()
        .single();
      
      if (error) throw error;

      // Add items
      let insertedItems: QuoteItem[] = [];
      if (items.length > 0) {
        const itemsWithOrderId = items.map(item => ({ ...item, order_id: data.id }));
        const { data: itemsData, error: itemsError } = await supabase.from('quote_items').insert(itemsWithOrderId).select();
        if (itemsError) {
          console.error('Error inserting order items:', itemsError);
        }
        insertedItems = (itemsData as QuoteItem[]) || [];
      }

      const newOrder: Order = { ...data, items: insertedItems } as Order;
      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (error) {
      console.error('Error adding order:', error);
      toast.error('Erro ao adicionar pedido');
      return null;
    }
  };

  const updateOrder = async (id: string, order: Partial<Order>): Promise<boolean> => {
    try {
      const { items, ...orderData } = order;
      const { error } = await supabase
        .from('orders')
        .update(orderData)
        .eq('id', id);
      
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === id ? { ...o, ...order } : o));
      return true;
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Erro ao atualizar pedido');
      return false;
    }
  };

  const deleteOrder = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setOrders(prev => prev.filter(o => o.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Erro ao excluir pedido');
      return false;
    }
  };

  // Transactions
  const fetchTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (error) throw error;
      setTransactions((data as Transaction[]) || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>): Promise<Transaction | null> => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([transaction])
        .select()
        .single();
      
      if (error) throw error;
      const newTransaction = data as Transaction;
      setTransactions(prev => [newTransaction, ...prev]);
      return newTransaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Erro ao adicionar transação');
      return null;
    }
  };

  const updateTransaction = async (id: string, transaction: Partial<Transaction>): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transactions')
        .update(transaction)
        .eq('id', id);
      
      if (error) throw error;
      setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...transaction } : t));
      return true;
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error('Erro ao atualizar transação');
      return false;
    }
  };

  const deleteTransaction = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setTransactions(prev => prev.filter(t => t.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Erro ao excluir transação');
      return false;
    }
  };

  // Mockups
  const fetchMockups = useCallback(async () => {
    setLoadingMockups(true);
    try {
      const { data, error } = await supabase
        .from('mockups')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMockups((data as Mockup[]) || []);
    } catch (error) {
      console.error('Error fetching mockups:', error);
    } finally {
      setLoadingMockups(false);
    }
  }, []);

  const addMockup = async (mockup: Omit<Mockup, 'id' | 'created_at' | 'updated_at'>): Promise<Mockup | null> => {
    try {
      const { data, error } = await supabase
        .from('mockups')
        .insert([mockup])
        .select()
        .single();
      
      if (error) throw error;
      const newMockup = data as Mockup;
      setMockups(prev => [newMockup, ...prev]);
      return newMockup;
    } catch (error) {
      console.error('Error adding mockup:', error);
      toast.error('Erro ao adicionar mockup');
      return null;
    }
  };

  const deleteMockup = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('mockups')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setMockups(prev => prev.filter(m => m.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting mockup:', error);
      toast.error('Erro ao excluir mockup');
      return false;
    }
  };

  // Company
  const fetchCompany = useCallback(async () => {
    setLoadingCompany(true);
    try {
      const { data, error } = await supabase
        .from('company')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      setCompany(data as Company | null);
    } catch (error) {
      console.error('Error fetching company:', error);
    } finally {
      setLoadingCompany(false);
    }
  }, []);

  const updateCompany = async (companyData: Partial<Company>): Promise<boolean> => {
    try {
      if (company) {
        const { error } = await supabase
          .from('company')
          .update(companyData)
          .eq('id', company.id);
        
        if (error) throw error;
        setCompany(prev => prev ? { ...prev, ...companyData } : null);
      } else {
        const { data, error } = await supabase
          .from('company')
          .insert([companyData as Company])
          .select()
          .single();
        
        if (error) throw error;
        setCompany(data as Company);
      }
      return true;
    } catch (error) {
      console.error('Error updating company:', error);
      toast.error('Erro ao atualizar empresa');
      return false;
    }
  };

  return (
    <ManagementContext.Provider
      value={{
        clients,
        loadingClients,
        fetchClients,
        addClient,
        updateClient,
        deleteClient,
        
        products,
        loadingProducts,
        fetchProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        
        quotes,
        loadingQuotes,
        fetchQuotes,
        addQuote,
        updateQuote,
        deleteQuote,
        convertQuoteToOrder,
        
        orders,
        loadingOrders,
        fetchOrders,
        addOrder,
        updateOrder,
        deleteOrder,
        
        transactions,
        loadingTransactions,
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        
        mockups,
        loadingMockups,
        fetchMockups,
        addMockup,
        deleteMockup,
        
        company,
        loadingCompany,
        fetchCompany,
        updateCompany,
      }}
    >
      {children}
    </ManagementContext.Provider>
  );
}

export function useManagement() {
  const context = useContext(ManagementContext);
  if (context === undefined) {
    throw new Error('useManagement must be used within a ManagementProvider');
  }
  return context;
}
