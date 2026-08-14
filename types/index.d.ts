export * from '../src/types/index'
export interface User { id: number; name: string; email: string; role: string }
export interface Property { id: number; title: string; price: number; currency: string; status: string }
export interface Payment { id: number; amount: number; currency: string; status: string }
export interface Receipt { id: number; pdf_path?: string }
