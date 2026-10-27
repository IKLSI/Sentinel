export const inputComponents = {
  MuiOutlinedInput: {
    styleOverrides: {
      root: {
        background: "var(--s2)",
        borderRadius: "var(--r)",
        fontSize: "13px",
        "& .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--border)",
          transition: "border-color 0.15s",
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--border2)",
        },
        "&.Mui-focused": {
          boxShadow: "0 0 0 3px var(--accent-subtle)",
        },
        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--accent)",
          borderWidth: "1px",
        },
        "&.Mui-error .MuiOutlinedInput-notchedOutline": {
          borderColor: "var(--red)",
        },
        "&.Mui-disabled": { opacity: 0.55 },
        "&.MuiInputBase-readOnly .MuiOutlinedInput-input": {
          color: "var(--muted2)",
          cursor: "default",
        },
      },
      input: {
        color: "var(--text)",
        "&::placeholder": { color: "var(--muted)", opacity: 1 },
        "&:focus": { boxShadow: "none" },
        "&:-webkit-autofill, &:-webkit-autofill:hover, &:-webkit-autofill:focus":
          {
            WebkitBoxShadow: "0 0 0 100px var(--s2) inset",
            WebkitTextFillColor: "var(--text)",
            caretColor: "var(--text)",
          },
        "&::-ms-reveal": { display: "none" },
      },
    },
  },
  MuiInputLabel: {
    styleOverrides: {
      root: {
        color: "var(--muted2)",
        fontSize: "13px",
        "&.Mui-focused": { color: "var(--accent)" },
        "&.Mui-error": { color: "var(--red)" },
      },
    },
  },
  MuiFormHelperText: {
    styleOverrides: {
      root: {
        margin: "6px 0 0",
        fontSize: "11.5px",
        color: "var(--muted2)",
        "&.Mui-error": { color: "var(--red)" },
      },
    },
  },
  MuiSwitch: {
    styleOverrides: {
      switchBase: {
        color: "var(--muted2)",
        "&.Mui-checked": { color: "var(--accent)" },
        "&.Mui-checked + .MuiSwitch-track": {
          backgroundColor: "var(--accent)",
          opacity: 0.5,
        },
      },
      track: { backgroundColor: "var(--border2)", opacity: 1 },
    },
  },
};
