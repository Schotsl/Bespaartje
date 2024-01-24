const BASE_URL = 'http://localhost:3000'
async function apiFetch(path: string) {
    return await fetch(`${BASE_URL}${path}`)
}

async function main() {
    console.log(await apiFetch('/'))
}

main()
