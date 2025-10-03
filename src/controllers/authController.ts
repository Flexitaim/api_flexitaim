import { Request, Response, NextFunction } from "express";
import * as userService from "../services/userService";
import * as jwt from "jsonwebtoken";

const JWT_SECRET: jwt.Secret = process.env.JWT_SECRET ?? "super_secret_key";
const EXPIRES_IN: jwt.SignOptions["expiresIn"] = "2h";

type AuthTokenPayload = {
  sub: string;        // JWT spec: string
  email: string;
  roleId: number;
  name: string;
  lastName: string;
};


export const googleSync = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { firebaseUid, name, lastName, email, cel } = req.body;
    
    if (!email || !name || !lastName) {
      return res.status(400).json({ message: "Email, name and lastName are required" });
    }
    
    console.log('Datos recibidos de Google:', { firebaseUid, name, lastName, email, cel });
    
    // Buscar usuario existente por email
    let user = await userService.getUserByEmailForAuth(email);
    
    if (user) {
      console.log('Usuario encontrado:', user.email);
      
      // VALIDACIÓN AGREGADA: Verificar si el usuario está activo
      if (!user.active) {
        console.log('Usuario inactivo intentando acceder:', user.email);
        return res.status(403).json({ 
          error: "USER_INACTIVE",
          message: "Tu cuenta está inactiva. Contactá al soporte para reactivarla." 
        });
      }
      
      // Usuario ya existe y está activo, continuar
    } else {
      // Crear nuevo usuario desde Google
      console.log('Creando nuevo usuario desde Google:', email);
      
      try {
        user = await userService.createGoogleUser({
          name,
          lastName,
          email,
          cel: cel || '',
          roleId: 3, // rol por defecto - ajustar según tu lógica
        });
      } catch (createError) {
        console.error('Error creando usuario de Google:', createError);
        return res.status(500).json({ message: "Error creating Google user" });
      }
    }
    
    // Generar token usando la misma estructura que login
    const payload: AuthTokenPayload = {
      sub: String(user.id),  
      email: user.email,
      roleId: user.roleId,
      name: user.name,
      lastName: user.lastName,
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });
    
    return res.json({
      message: "Google login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        cel: user.cel,
        roleId: user.roleId,
        active: user.active,
      },
    });
    
  } catch (err) {
    console.error('Error en googleSync:', err);
    next(err);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let { email, password } = req.body as { email: string; password: string };
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = email.trim().toLowerCase();
    const pwd = password.trim();                                  // 👈 TRIM

    // Traer usuario sin filtrar por active para diferenciar casos
    const user = await userService.getUserByEmailForAuth(email);
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    // Si está inactivo, devolver mensaje específico
    if (!user.active) {
      return res.status(403).json({ message: "USER_INACTIVE" }); // 👈
    }

    const valid = await user.validatePassword(pwd);               // verifica contra hash
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const payload: AuthTokenPayload = {
      sub: String(user.id),
      email: user.email,
      roleId: user.roleId,
      name: user.name,
      lastName: user.lastName,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: EXPIRES_IN });

    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        name: user.name,
        lastName: user.lastName,
        email: user.email,
        cel: user.cel,
        roleId: user.roleId,
        active: user.active,
      },
    });
  } catch (err) {
    next(err);
  }
};

