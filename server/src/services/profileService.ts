import { supabaseAdmin } from '../lib/supabase.js'

export interface Profile {
  displayName: string
  balance: number
}

const STARTING_BALANCE = 1000

/** Fetch a player's profile, or null if it doesn't exist yet. */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('display_name, balance')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!data) return null
  return { displayName: data.display_name, balance: data.balance }
}

/** Create a profile row after signup. Idempotent-ish: errors if it exists. */
export async function createProfile(userId: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .insert({ id: userId, display_name: displayName, balance: STARTING_BALANCE })
    .select('display_name, balance')
    .single()

  if (error) throw new Error(error.message)
  return { displayName: data.display_name, balance: data.balance }
}

/** Update a player's display name. */
export async function updateProfile(userId: string, displayName: string): Promise<Profile> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select('display_name, balance')
    .single()

  if (error) throw new Error(error.message)
  return { displayName: data.display_name, balance: data.balance }
}

export async function getBalance(userId: string): Promise<number> {
  const profile = await getProfile(userId)
  if (!profile) throw new Error('Profile not found')
  return profile.balance
}

async function setBalance(userId: string, balance: number): Promise<number> {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ balance })
    .eq('id', userId)
    .select('balance')
    .single()

  if (error) throw new Error(error.message)
  return data.balance
}

/** Deduct coins; throws if the player can't afford it. Returns new balance. */
export async function deductCoins(userId: string, amount: number): Promise<number> {
  if (amount <= 0) return getBalance(userId)
  const balance = await getBalance(userId)
  if (balance < amount) throw new Error('Insufficient balance')
  return setBalance(userId, balance - amount)
}

/** Add coins. Returns new balance. */
export async function addCoins(userId: string, amount: number): Promise<number> {
  if (amount <= 0) return getBalance(userId)
  const balance = await getBalance(userId)
  return setBalance(userId, balance + amount)
}
