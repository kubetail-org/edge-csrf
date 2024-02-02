'use server';

export async function example1(csrfToken: string, data: { key1: string; key2: string; }) {
  console.log(data);
}

export async function example2(data: FormData) {
  console.log(data);
}
