export const Button = ({ children, variant = "solid", size = "md", ...props }) => {
    const base = "rounded-md px-4 py-2 font-semibold transition";
    const variants = {
        solid: "bg-blue-600 text-white hover:bg-blue-700",
        outline: "border border-blue-600 text-blue-600 hover:bg-blue-50",
    };
    const sizes = {
        sm: "text-sm py-1 px-2",
        md: "text-base",
    };

    return (
        <button
            {...props}
            className={`${base} ${variants[variant]} ${sizes[size]} ${props.className || ""}`}
        >
            {children}
        </button>
    );
};
