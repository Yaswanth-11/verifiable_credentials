export const sortProtectedHeader = protectedHeader => {
    const { alg, iss, kid, typ, cty, ...rest } = protectedHeader
    return JSON.parse(
      JSON.stringify({
        alg,
        iss,
        kid,
        typ,
        cty,
        ...rest
      })
    )
  }
  