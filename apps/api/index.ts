import express from "express";
import authRouter from "./src/routes/auth";
import onrampRouter from "./src/routes/onramp";
import orderRouter from "./src/routes/order";
import positionsRouter from "./src/routes/positions";
import ordersRouter from "./src/routes/orders";
import fillsRouter from "./src/routes/fills";
import equityRouter from "./src/routes/equity";

const app = express();
app.use(express.json());

app.use(authRouter);
app.use(onrampRouter);
app.use(orderRouter);
app.use(positionsRouter);
app.use(ordersRouter);
app.use(fillsRouter);
app.use(equityRouter);

app.listen(3000, () => {
    console.log("server running on port 3000");
});