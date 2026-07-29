const authenticate = require("./middleware");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const express = require("express");
const bcrypt = require("bcryptjs");
const yup = require("yup");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const app = express();

const signupSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  name: yup.string().required(),
  businessName: yup.string().required(),
  businessAddress: yup.string().required(),
  businessPhone: yup.string().required(),
});

app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("API is Running...");
});

// signup
app.post("/signup", async (req, res) => {
  try {
    await signupSchema.validate(req.body, { abortEarly: false });
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const user = await prisma.user.create({
      data: {
        email: req.body.email,
        password: hashedPassword,
        name: req.body.name,
        businessName: req.body.businessName,
        businessAddress: req.body.businessAddress,
        businessPhone: req.body.businessPhone,
      },
    });

    res
      .status(201)
      .json({ message: "User created successfully", userId: user.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// login
app.post("/login", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { email: req.body.email },
    });
    if (!user)
      return res.status(400).json({ error: "Invalid email or password" });

    const isPasswordValid = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordValid)
      return res.status(400).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ______________Items__________________

// create

app.post("/items", authenticate, async (req, res) => {
  try {
    const { name, price } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: "Name and price are required" });
    }

    const item = await prisma.item.create({
      data: {
        name,
        userId: req.userId,
        price: Math.round(price * 100),
      },
    });
    res.status(201).json({ message: "Item created successfully", item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get all

app.get("/items", authenticate, async (req, res) => {
  try {
    const items = await prisma.item.findMany({ where: { userId: req.userId } });
    const itemsToShow = items.map((item) => ({
      ...item,
      price: item.price / 100,
    }));
    res.status(200).json({ itemsToShow });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get one

app.get("/items/:id", authenticate, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!item || item.userId !== req.userId)
      return res.status(404).json({ error: "Item not found" });

    const itemToShow = { ...item, price: item.price / 100 };
    res.status(200).json({ itemToShow });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// update

app.put("/items/:id", authenticate, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!item || item.userId !== req.userId)
      return res.status(404).json({ error: "Item not found" });

    const updated = await prisma.item.update({
      where: { id: parseInt(req.params.id) },
      data: { name: req.body.name, price: Math.round(req.body.price * 100) },
    });
    res.status(200).json({ message: "Item updated successfully", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete

app.delete("/items/:id", authenticate, async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!item || item.userId !== req.userId)
      return res.status(404).json({ error: "Item not found" });

    await prisma.item.delete({ where: { id: parseInt(req.params.id) } });
    res.status(200).json({ message: "Item deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ________________customers__________________

// create

app.post("/customers", authenticate, async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res
        .status(400)
        .json({ error: "Name, email, and phone are required" });
    }

    const customer = await prisma.customer.create({
      data: { name, email, phone, userId: req.userId },
    });
    res
      .status(201)
      .json({ message: "Customer created successfully", customer });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get all

app.get("/customers", authenticate, async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { userId: req.userId },
    });
    res.status(200).json({ customers });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get one

app.get("/customers/:id", authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!customer || customer.userId !== req.userId)
      return res.status(404).json({ error: "Customer not found" });
    res.status(200).json({ customer });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// update

app.put("/customers/:id", authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!customer || customer.userId !== req.userId)
      return res.status(404).json({ error: "Customer not found" });

    const updated = await prisma.customer.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
      },
    });
    res.status(200).json({ message: "Customer updated successfully", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete

app.delete("/customers/:id", authenticate, async (req, res) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!customer || customer.userId !== req.userId)
      return res.status(404).json({ error: "Customer not found" });

    await prisma.customer.delete({ where: { id: parseInt(req.params.id) } });
    res.status(200).json({ message: "Customer deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// _______________Terms & Conditions_______________

// create

app.post("/terms", authenticate, async (req, res) => {
  try {
    const { title, body } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: "Title and body are required" });
    }

    const term = await prisma.termsAndConditions.create({
      data: { title, body, userId: req.userId },
    });
    res.status(201).json({ message: "Term created successfully", term });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get all

app.get("/terms", authenticate, async (req, res) => {
  try {
    const terms = await prisma.termsAndConditions.findMany({
      where: { userId: req.userId },
    });
    res.status(200).json({ terms });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get one

app.get("/terms/:id", authenticate, async (req, res) => {
  try {
    const term = await prisma.termsAndConditions.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!term || term.userId !== req.userId)
      return res.status(404).json({ error: "Term not found" });
    res.status(200).json({ term });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// update

app.put("/terms/:id", authenticate, async (req, res) => {
  try {
    const term = await prisma.termsAndConditions.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!term || term.userId !== req.userId)
      return res.status(404).json({ error: "Term not found" });

    const updated = await prisma.termsAndConditions.update({
      where: { id: parseInt(req.params.id) },
      data: { title: req.body.title, body: req.body.body },
    });
    res.status(200).json({ message: "Term updated successfully", updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete

app.delete("/terms/:id", authenticate, async (req, res) => {
  try {
    const term = await prisma.termsAndConditions.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!term || term.userId !== req.userId)
      return res.status(404).json({ error: "Term not found" });

    await prisma.termsAndConditions.delete({
      where: { id: parseInt(req.params.id) },
    });
    res.status(200).json({ message: "Term deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// _________________Invoice__________________________

app.post("/invoices", authenticate, async (req, res) => {
  try {
    const {
      title,
      customerId,
      dueDate,
      isRecurring,
      tax,
      discountName,
      discountType,
      discountAmount,
      discountDeadline,
      termsText,
      items,
    } = req.body;

    if (!customerId || !dueDate || !items || items.length === 0) {
      return res
        .status(400)
        .json({ error: "customerId, dueDate, and at least one item required" });
    }

    const itemsData = items.map((item) => {
      const unitPriceKobo = Math.round(item.unitPrice * 100);
      return {
        itemId: item.itemId || null,
        name: item.name,
        unitPrice: unitPriceKobo,
        quantity: item.quantity,
      };
    });

    const subTotal = itemsData.reduce(
      (sum, items) => sum + items.unitPrice * items.quantity,
      0
    );

    let discountKobo = 0;
    if (discountAmount) {
      if (discountType === "percentage") {
        discountKobo = Math.round(subTotal * (discountAmount / 100));
      } else {
        discountKobo = Math.round(discountAmount * 100);
      }
    }

    const afterDiscount = subTotal - discountKobo;

    const taxKobo = tax ? Math.round(afterDiscount * (tax / 100)) : 0;
    const totalAmount = afterDiscount + taxKobo;

    const invoiceCount = await prisma.invoice.count({
      where: { userId: req.userId },
    });
    const invoiceNumber = `INV-${String(invoiceCount + 1).padStart(4, "0")}`;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        title: title || "Invoice",
        dueDate: new Date(dueDate),
        isRecurring: isRecurring || false,
        tax: tax || 0,
        discountName: discountName || null,
        discountType: discountType || null,
        discountAmount: discountAmount
          ? discountType === "percentage"
            ? discountAmount
            : Math.round(discountAmount * 100)
          : null,
        discountDeadline: discountDeadline ? new Date(discountDeadline) : null,
        termsText: termsText || null,
        subtotal: subTotal,
        totalAmount,
        customerId,
        userId: req.userId,
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });

    res.status(201).json({ message: "Invoice created successfully", invoice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// List all invoices

app.get("/invoices", authenticate, async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: { userId: req.userId },
      include: { items: true, customer: true },
    });
    res.status(200).json({ invoices });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get one invoice

app.get("/invoices/:id", authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { items: true },
    });
    if (!invoice || invoice.userId !== req.userId)
      return res.status(404).json({ error: "Invoice not found" });
    res.status(200).json({ invoice });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// update invoice

app.put("/invoices/:id", authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!invoice || invoice.userId !== req.userId) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const {
      title,
      customerId,
      dueDate,
      isRecurring,
      tax,
      discountName,
      discountType,
      discountAmount,
      discountDeadline,
      termsText,
      items,
    } = req.body;

    if ( !customerId || !dueDate || !items || items.length === 0 ) {
      return res.status(400).json( { error: 'customerId, dueDate, and at least one item are required' } );
    }

    const itemsData = items.map((item) => {
      const unitPriceKobo = Math.round(item.unitPrice * 100);
      return {
        itemId: item.itemId || null,
        name: item.name,
        unitPrice: unitPriceKobo,
        quantity: item.quantity,
      };
    });

    const subTotal = itemsData.reduce(( sum, items ) => sum + ( items.unitPrice * items.quantity ), 0 );

    let discountKobo = 0;
    if (discountAmount) {
      discountKobo = discountType === 'percentage'
        ? Math.round(subTotal * (discountAmount / 100))
        : Math.round(discountAmount * 100);
    }

    const afterDiscount = subTotal - discountKobo;
    const taxKobo = tax ? Math.round(afterDiscount * (tax / 100)) : 0;
    const totalAmount = afterDiscount + taxKobo;

    const updated = await prisma.invoice.update({
      where: { id: parseInt(req.params.id) },
      data: {
        title: title || 'Invoice',
        dueDate: new Date(dueDate),
        isRecurring: isRecurring || false,
        tax: tax || 0,
        discountName: discountName || null,
        discountType: discountType || null,
        discountAmount: discountAmount ? (discountType === 'percentage' ? discountAmount : Math.round(discountAmount * 100)) : null,
        discountDeadline: discountDeadline ? new Date(discountDeadline) : null,
        termsText: termsText || null,
        subtotal: subTotal,
        totalAmount,
        customerId,
        items: {
          deleteMany: {},
          create: itemsData,
        },
      },
      include: { items: true }
    });

    res.status(200).json({ message: 'Invoice updated Succesfully', updated });
      
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// delete invoice
app.delete('/invoices/:id', authenticate, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { id: parseInt(req.params.id) } });
    if (!invoice || invoice.userId !== req.userId) {
      return res.status(400).json({ error: 'Invoice Not Found' });
    }

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: parseInt(req.params.id) } });
    await prisma.invoice.delete({ where: { id: parseInt(req.params.id) } });

    res.status(200).json({ message: 'Invoice Deleted Sucessfully' });
    
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
});

// payment page

app.get('/public/invoices/:publicId', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { publicId: req.params.publicId },
      include: {
        items: true,
        customer: true,
        user: { select: { businessName: true, businessAddress: true, businessPhone: true } },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoiceToShow = {
      ...invoice,
      subtotal: invoice.subtotal / 100,
      totalAmount: invoice.totalAmount / 100,
      items: invoice.items.map(item => ({ ...item, unitPrice: item.unitPrice / 100 })),
    };

    res.status(200).json({ invoice: invoiceToShow });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// confirm payment

app.put('/public/invoices/:publicId/pay', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({ where: { publicId: req.params.publicId } });
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const updated = await prisma.invoice.update({
      where: { publicId: req.params.publicId },
      data: { status: 'paid' },
    });

    const invoiceToShow = {
      ...updated,
      subtotal: updated.subtotal / 100,
      totalAmount: updated.totalAmount / 100,
    }

    res.status(200).json({ message: 'Payment confirmed', invoice: invoiceToShow });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// get user details

app.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        businessName: true,
        businessAddress: true,
        businessPhone: true,
      },
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// edit info

app.put('/me', authenticate, async (req, res) => {
  try {
    const { businessName, businessAddress, businessPhone } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId },
      data: {
        businessName: businessName || undefined,
        businessAddress: businessAddress || undefined,
        businessPhone: businessPhone || undefined,
      },
      select: { id: true, name: true, email: true, businessName: true, businessAddress: true, businessPhone: true },
    });
    res.status(200).json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// _________________Protected Route__________________

app.get("/protected", authenticate, (req, res) => {
  res.json({ message: "You are Protected!", userId: req.userId });
});

module.exports = app;