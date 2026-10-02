import { Router, type Request, type Response } from "express";
import { PreOrder } from "../models/PreOrder.js";
import { requireAuth } from "../middleware/auth.js";
import type { NewPreOrderBody } from "../types/index.js";

export const preOrderRouter = Router();

// One line, and every route in this file is behind the token check.
// Anything above this line would be public; everything below needs a
// valid Authorization header.
preOrderRouter.use(requireAuth);

interface IdParam {
  id: string;
}

// GET /api/preorders -- only the ones belonging to this token
preOrderRouter.get("/", async (req: Request, res: Response) => {
  const preOrders = await PreOrder.find({
    customerId: req.userId,
  }).sort({ orderedAt: -1 });
  res.json(preOrders);
});

// GET /api/preorders/:id -- the right row, AND the right owner.
// Without customerId here, changing the id in the URL reads another row.
preOrderRouter.get(
  "/:id",
  async (req: Request<IdParam>, res: Response) => {
    const preOrder = await PreOrder.findOne({
      _id: req.params.id,
      customerId: req.userId,
    });

    if (!preOrder) {
      res.status(404).json({ message: "No pre-order with that id" });
      return;
    }

    res.json(preOrder);
  },
);

// POST /api/preorders -- the body supplies the product fields.
// customerId comes from the token, never from the request.
preOrderRouter.post(
  "/",
  async (
    req: Request<unknown, unknown, NewPreOrderBody>,
    res: Response,
  ) => {
    const preOrder = await PreOrder.create({
      ...req.body,
      // Not req.body.customerId. The owner comes off the verified
      // token, so a request cannot claim to be someone else by id.
      customerId: req.userId,
    });

    res.status(201).json(preOrder);
  },
);

// PATCH /api/preorders/:id
preOrderRouter.patch(
  "/:id",
  async (
    req: Request<IdParam, unknown, Partial<NewPreOrderBody>>,
    res: Response,
  ) => {
    const preOrder = await PreOrder.findOneAndUpdate(
      { _id: req.params.id, customerId: req.userId },
      req.body,
      // new: return the row AFTER the change, not before.
      // runValidators: schema rules are skipped on updates otherwise.
      { new: true, runValidators: true },
    );

    if (!preOrder) {
      res.status(404).json({ message: "No pre-order with that id" });
      return;
    }

    res.json(preOrder);
  },
);

// DELETE /api/preorders/:id
preOrderRouter.delete(
  "/:id",
  async (req: Request<IdParam>, res: Response) => {
    const preOrder = await PreOrder.findOneAndDelete({
      _id: req.params.id,
      customerId: req.userId,
    });

    if (!preOrder) {
      res.status(404).json({ message: "No pre-order with that id" });
      return;
    }

    // 204 means "done, and there is deliberately no body to send".
    res.status(204).send();
  },
);