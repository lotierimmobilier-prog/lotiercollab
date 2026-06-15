import { useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout';
import { Topbar } from '../../components/layout/Topbar';
import { BookOpen, Shield, TriangleAlert, Map, FileSearch, Signature as FileSignature, Download, GraduationCap, Award, ChevronLeft, ChevronRight, RotateCcw, CircleCheck as CheckCircle2, Eye, EyeOff, Building2, Users, TriangleAlert as AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/button';

type Section =
  | 'overview'
  | 'obligations'
  | 'alertes'
  | 'cartographie'
  | 'cas'
  | 'declaration'
  | 'guide_op'
  | 'flashcards'
  | 'attestation';

const NAV_ITEMS: { id: Section; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Shield },
  { id: 'obligations', label: 'Vos obligations', icon: CheckCircle2 },
  { id: 'alertes', label: 'Critères d\'alerte', icon: TriangleAlert },
  { id: 'cartographie', label: 'Cartographie & Typologie', icon: Map },
  { id: 'cas', label: 'Cas typologiques', icon: FileSearch },
  { id: 'declaration', label: 'Déclaration de soupçon', icon: FileSignature },
  { id: 'guide_op', label: 'Guide Opérationnel TRACFIN', icon: Download },
  { id: 'flashcards', label: 'Flashcards d\'entraînement', icon: GraduationCap },
  { id: 'attestation', label: 'Attestation de formation', icon: Award },
];

const FLASHCARDS = [
  { q: "Que signifie l'acronyme TRACFIN ?", a: "Traitement du renseignement et action contre les circuits financiers clandestins." },
  { q: "À quel ministère le service TRACFIN est-il administrativement rattaché ?", a: "Le ministère de l'Économie, des Finances et de l'Industrie." },
  { q: "Selon l'article L. 561-15 du CMF, quel est le critère de gravité d'une infraction déclenchant l'obligation de déclaration ?", a: "L'infraction doit être passible d'une peine privative de liberté supérieure à 1 an." },
  { q: "Vrai ou Faux : L'obligation de déclaration à TRACFIN remplace les obligations de vigilance à l'égard de la clientèle.", a: "Faux — elle est complémentaire des obligations de vigilance." },
  { q: "Pour une personne morale, quel est le seuil de détention du capital imposant l'identification de l'actionnaire ?", a: "Plus de 25% du capital." },
  { q: "Citez un critère d'alerte lié au profil de l'acquéreur lors d'une transaction immobilière.", a: "Une incohérence entre le montant de l'apport / flux et le profil de l'acquéreur." },
  { q: "Comment appelle-t-on l'utilisation d'une tierce personne pour masquer l'identité réelle du bénéficiaire ?", a: "Le recours à un prête-nom (ou homme de paille)." },
  { q: "Vrai ou Faux : Un prix de vente anormalement bas peut être un indicateur de blanchiment d'argent.", a: "Vrai." },
  { q: "Quel organisme publie les listes de pays à risque utilisées par les mandataires immobiliers ?", a: "Le GAFI (Groupe d'action financière)." },
  { q: "Vrai ou Faux : Les agents mandataires immobiliers, bien que n'ayant pas la carte T, sont soumis aux obligations TRACFIN.", a: "Vrai — car ils interviennent comme intermédiaires dans des opérations immobilières." },
  { q: "Quelle est la durée légale de conservation des documents relatifs à une opération ?", a: "5 ans à compter de la fin de la relation d'affaires ou de la réalisation de l'opération." },
  { q: "Vrai ou Faux : TRACFIN est une cellule de renseignement financier nationale.", a: "Vrai." },
  { q: "Lors d'une transaction annulée, quelle demande de remboursement est jugée suspecte ?", a: "Une demande de remboursement sur un compte tiers, différent du compte émetteur." },
  { q: "Le secret professionnel est-il opposable à TRACFIN par les professionnels assujettis ?", a: "Non — l'obligation de déclaration prime sur le secret professionnel dans les conditions prévues par la loi." },
  { q: "Vrai ou Faux : Une déclaration à TRACFIN doit obligatoirement être accompagnée d'une plainte au Procureur de la République.", a: "Faux — la déclaration TRACFIN repose sur le soupçon, tandis que la saisine du Procureur repose sur la certitude." },
  { q: "Quelle autorité peut sanctionner un agent immobilier en cas de défaut de vigilance TRACFIN ?", a: "La DGCCRF." },
  { q: "Quel type de flux financier sur un compte privé doit alerter un mandataire immobilier ?", a: "Des flux à caractère professionnel sur un compte personnel." },
  { q: "L'obligation de vigilance s'applique 'avant toute signature de mandat' et 'tout au long de la _____'.", a: "Relation d'affaires." },
  { q: "Concept : Blanchiment de capitaux", a: "Action de donner une apparence légitime à des fonds provenant d'activités illégales." },
  { q: "L'obligation de déclaration TRACFIN s'applique-t-elle aux tentatives d'opérations suspectes ?", a: "Oui — le soupçon porte sur l'intention et l'origine des fonds, même si l'opération n'aboutit pas." },
];

function OverviewSection() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Qu'est-ce que TRACFIN ?</h2>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          <strong>TRACFIN</strong> (Traitement du Renseignement et Action contre les Circuits Financiers clandestins) est le service de renseignement français chargé de la lutte contre le blanchiment d'argent et le financement du terrorisme.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Les professionnels de l'immobilier sont <strong>assujettis aux obligations LCB-FT</strong> (Lutte Contre le Blanchiment et le Financement du Terrorisme) depuis 1998. Ils jouent un rôle essentiel dans la détection des opérations suspectes.
        </p>
      </div>
      <div className="bg-[#1A3A5C] rounded-xl p-5 text-white">
        <p className="font-bold text-sm mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" />Les avantages du registre Tracfin / LCB-FT</p>
        <ul className="space-y-2">
          {[
            "Définir une équipe dédiée aux déclarations (organigramme Tracfin)",
            "Accéder au protocole Tracfin interne à l'entreprise",
            "Créer des fiches contacts pour vérifier l'identité des clients, identifier l'origine des fonds et conserver les pièces justificatives",
            "Simplifier vos vérifications clients grâce à l'interconnexion du registre avec les bases de données sécurisées d'instances reconnues",
            "Établir une cartographie des risques pour analyser chaque profil client et adapter votre niveau de vigilance en conséquence",
            "Effectuer vos déclarations de soupçons auprès de la cellule Tracfin",
            "Stocker et sécuriser en ligne toutes vos démarches Tracfin",
            "Accéder au registre en temps réel en cas de contrôle",
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-white/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-[#1A3A5C]" />Professionnels concernés</p>
          <ul className="space-y-1">
            {["Agents immobiliers et intermédiaires en transactions", "Syndics de copropriété (depuis 2014)", "Gestionnaires de location (depuis 2016)"].map((p, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1A3A5C] mt-1.5 flex-shrink-0" />{p}
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm text-gray-900 mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-[#1A3A5C]" />Pourquoi le secteur immobilier ?</p>
          <p className="text-xs text-gray-600 leading-relaxed">L'immobilier constitue un <strong>vecteur privilégié de blanchiment</strong> en raison des montants élevés des transactions, de la possibilité d'opacifier l'origine des fonds et de la capacité à transférer de la valeur de manière durable.</p>
        </div>
      </div>
    </div>
  );
}

function ObligationsSection() {
  const items = [
    {
      title: "1. Cartographie des risques",
      desc: "Établir et maintenir une analyse des risques de blanchiment propres à votre activité.",
      points: ["Identifier les risques selon la nature des opérations", "Adapter les mesures de vigilance en fonction du niveau de risque"],
    },
    {
      title: "2. Vigilance et identification du client",
      desc: "Vérifier l'identité de vos clients et comprendre la nature de la relation d'affaires.",
      points: ["Recueillir les documents d'identité officiels", "Vérifier l'adresse et la situation professionnelle", "S'assurer de la cohérence entre le profil et l'opération"],
    },
    {
      title: "3. Identification du bénéficiaire effectif",
      desc: "Pour les personnes morales, identifier la personne physique qui contrôle réellement l'entité.",
      points: ["Détenir plus de 25% du capital ou des droits de vote", "Exercer un pouvoir de contrôle sur les organes de direction"],
    },
    {
      title: "4. Détection des PPE",
      desc: "Les Personnes Politiquement Exposées présentent un risque accru et nécessitent une vigilance renforcée.",
      points: ["Dirigeants politiques, membres de gouvernement, parlementaires", "Hauts fonctionnaires, dirigeants d'entreprises publiques", "Leurs proches collaborateurs et membres de leur famille"],
    },
    {
      title: "5. Conservation des documents",
      desc: "Archiver tous les documents et informations pendant une durée minimale de 5 ans.",
      points: ["Documents d'identité et justificatifs", "Analyses de risque et mesures de vigilance", "Correspondances et échanges liés à l'opération"],
    },
    {
      title: "6. Déclaration de soupçon",
      desc: "Lorsque vous identifiez une opération suspecte, vous avez l'obligation de la déclarer à TRACFIN via le portail sécurisé ERMES. Cette déclaration est strictement confidentielle.",
      points: [],
    },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Vos obligations en matière de LCB-FT</h2>
        <p className="text-sm text-gray-500">En tant que professionnel de l'immobilier, vous devez respecter plusieurs obligations légales.</p>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-sm text-[#1A3A5C] mb-1">{item.title}</p>
            <p className="text-xs text-gray-600 mb-2">{item.desc}</p>
            {item.points.length > 0 && (
              <ul className="space-y-0.5">
                {item.points.map((p, j) => (
                  <li key={j} className="text-xs text-gray-600 flex items-start gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 mt-1.5 flex-shrink-0" />{p}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 font-medium">Le non-respect des obligations LCB-FT peut entraîner des sanctions administratives et pénales, y compris des amendes significatives et la suspension d'activité.</p>
      </div>
    </div>
  );
}

function AlertesSection() {
  const criteres = [
    { title: "Incohérence financière", desc: "Discordance entre le profil du client (âge, revenus, profession) et la valeur du bien immobilier." },
    { title: "Prix suspect", desc: "Discordance entre la valeur de marché du bien et le montant de la transaction (sur/sous-évaluation)." },
    { title: "Présence d'un tiers", desc: "Présence d'une personne tierce très active lors de la transaction, laissant penser qu'elle est le véritable bénéficiaire." },
    { title: "Achats-reventes rapides", desc: "Le client procède à des achats et reventes dans un délai très court, sans justification économique." },
    { title: "Origine des fonds", desc: "Les fonds proviennent d'un compte différent de celui de l'acquéreur ou d'un pays à fiscalité privilégiée." },
    { title: "Montage complexe", desc: "Recours à plusieurs personnes morales ou montage juridique anormalement complexe opacifiant le bénéficiaire effectif." },
    { title: "Secteur sensible", desc: "Les fonds proviennent d'un secteur d'activité sensible (BTP, restauration, téléphonie, etc.)." },
    { title: "Comportement atypique", desc: "Comportement insolite du client, réticence à fournir des justificatifs, empressement inhabituel." },
    { title: "Connivence", desc: "Connivence supposée entre le vendeur et l'acquéreur, comportement coordonné suspect." },
    { title: "Personne Politiquement Exposée", desc: "Présence d'une PPE nécessitant une vigilance renforcée systématique." },
    { title: "Zone géographique sensible", desc: "Lien avec un pays figurant sur les listes de pays non coopératifs ou à risque élevé (GAFI)." },
    { title: "Paiement atypique", desc: "Demande de paiement en espèces pour des montants importants ou modalités de paiement inhabituelles." },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Critères d'alerte et signaux suspects</h2>
        <p className="text-sm text-gray-500">Certains indices doivent vous alerter et vous conduire à approfondir votre vigilance.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {criteres.map((c, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
            <p className="font-semibold text-xs text-[#1A3A5C] mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500" />{c.title}
            </p>
            <p className="text-xs text-gray-600">{c.desc}</p>
          </div>
        ))}
      </div>
      <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-4">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">Ces critères ne sont pas exhaustifs. Un seul critère n'est pas forcément synonyme de blanchiment, mais la <strong>combinaison de plusieurs critères</strong> doit vous alerter et vous conduire à approfondir votre vigilance, voire à effectuer une déclaration de soupçon à TRACFIN.</p>
      </div>
    </div>
  );
}

function CartographieSection() {
  const levels = [
    {
      level: "NIVEAU 1 : Biens à risque faible",
      color: "border-emerald-200 bg-emerald-50/40",
      badge: "bg-emerald-100 text-emerald-700",
      label: "Vigilance Standard",
      caract: ["Logements destinés à l'habitation principale de l'acquéreur", "Ventes réalisées avec financement bancaire classique", "Transactions portant sur des montants modestes en rapport avec le marché local", "Profil client standard et transparent"],
      exemples: ["Appartement ou maison acquis pour y résider", "Primo-accession financée par un crédit immobilier", "Mutation classique entre particuliers"],
      vigilance: ["Identification et vérification de l'identité du client", "Conservation des pièces justificatives", "Traçabilité de l'opération"],
    },
    {
      level: "NIVEAU 2 : Biens à risque moyen",
      color: "border-amber-200 bg-amber-50/40",
      badge: "bg-amber-100 text-amber-700",
      label: "Vigilance Renforcée",
      caract: ["Immeubles de rapport (biens destinés à la location)", "Locaux commerciaux, bureaux, entrepôts", "Biens détenus ou acquis par une SCI", "Ventes réalisées sans recours à un financement bancaire"],
      exemples: ["Acquisition d'un immeuble avec plusieurs logements destinés à la location", "Achat de murs commerciaux par un professionnel", "Paiement comptant d'un bien d'investissement"],
      vigilance: ["Approfondissement des informations relatives au client", "Justification de l'origine des fonds", "Vérification de la cohérence économique de l'opération", "Vérification de l'identité des bénéficiaires effectifs (SCI)"],
    },
    {
      level: "NIVEAU 3 : Biens à risque élevé",
      color: "border-red-200 bg-red-50/40",
      badge: "bg-red-100 text-red-700",
      label: "Vigilance Maximale",
      caract: ["Biens de luxe ou de très forte valeur", "Opérations rapides d'achat puis revente sans justification économique", "Paiement avec fonds propres importants sans financement bancaire", "Acquisition par société étrangère (pays à risque)", "Clients non résidents ou juridictions à fiscalité privilégiée"],
      exemples: ["Villa de prestige acquise comptant par une société offshore", "Bien acheté puis revendu dans un délai très court sans travaux", "Acquisition par un client établi dans un paradis fiscal"],
      vigilance: ["Vérification approfondie de l'identité et du bénéficiaire effectif", "Recherche documentée sur l'origine et la licéité des fonds", "Analyse de la cohérence avec le profil et l'activité du client", "Documentation exhaustive de tous les éléments de l'opération", "Évaluation systématique de l'opportunité de déclarer à TRACFIN"],
    },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cartographie des risques et typologie des biens</h2>
        <p className="text-sm text-gray-600">Conformément aux articles L561-4-1 et suivants du CMF, l'agence doit mettre en œuvre une <strong>approche par les risques</strong> pour adapter son niveau de vigilance à chaque opération.</p>
      </div>
      <div className="space-y-4">
        {levels.map((l, i) => (
          <div key={i} className={`rounded-xl border p-4 ${l.color}`}>
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-sm text-gray-900">{l.level}</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${l.badge}`}>{l.label}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Caractéristiques</p>
                <ul className="space-y-0.5">{l.caract.map((c, j) => <li key={j} className="text-xs text-gray-700 flex items-start gap-1"><span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 flex-shrink-0" />{c}</li>)}</ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Exemples typiques</p>
                <ul className="space-y-0.5">{l.exemples.map((e, j) => <li key={j} className="text-xs text-gray-700 flex items-start gap-1"><span className="text-gray-400">→</span>{e}</li>)}</ul>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1.5">Niveau de vigilance</p>
                <ul className="space-y-0.5">{l.vigilance.map((v, j) => <li key={j} className="text-xs text-gray-700 flex items-start gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0 mt-0.5" />{v}</li>)}</ul>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-[#1A3A5C]/5 border border-[#1A3A5C]/20 rounded-xl p-4">
        <p className="text-xs font-semibold text-[#1A3A5C] mb-1">Conservation et traçabilité — Art. L561-12 CMF</p>
        <p className="text-xs text-gray-600">L'ensemble des éléments relatifs à l'évaluation du risque doit être conservé pendant <strong>5 ans</strong> à compter de la fin de la relation d'affaires. La cartographie doit faire l'objet d'une révision régulière.</p>
      </div>
    </div>
  );
}

function CasSection() {
  const cas = [
    {
      title: "CAS 1 : Achat pour le compte d'une personne tierce (Homme de paille)",
      faits: "M. X, 21 ans, technicien de maintenance, se porte acquéreur d'un appartement de 490 000 €. Il indique financer avec des fonds propres, sans prêt. Lors des visites, il est accompagné de Mme Z, une personne plus âgée sans lien familial apparent. M. X reste discret tandis que Mme Z mène toutes les discussions et montre un empressement inhabituel. Elle demande si une partie peut être réglée en espèces.",
      investigation: "M. X travaille depuis 18 mois, était non-imposable l'année précédente. Mme Z et son époux gèrent une PME d'import/export de véhicules. L'analyse révèle des flux importants du compte de la société vers les comptes personnels et une minoration du chiffre d'affaires déclaré. M. X sert d'homme de paille pour blanchir des fonds détournés.",
      criteres: ["Jeune âge de l'acquéreur (21 ans)", "Incohérence revenus/valeur du bien (technicien / 490 000 €)", "Absence de recours à un prêt", "Présence d'une personne tierce très active", "Demande de règlement en espèces"],
    },
    {
      title: "CAS 2 : Utilisation d'un compte intermédiaire (Compte taxi)",
      faits: "Mme X souhaite acquérir un bien manifestement surévalué et accepte immédiatement le prix demandé. Pour le financement, les fonds proviendront d'un compte d'une société située dans un pays à fiscalité privilégiée. Lorsque l'agence demande des justificatifs, Mme X indique qu'elle les communiquera ultérieurement — mais ne les fournit jamais.",
      investigation: "Mme X, mère de 5 enfants, est non imposable et n'a aucun patrimoine. Son compte montre des dépôts fréquents d'espèces < 1 000 € et des virements depuis un pays non coopératif. Les investigations révèlent qu'elle agit pour le compte d'un ressortissant français poursuivi pour extorsion de fonds et escroquerie en bande organisée.",
      criteres: ["Surévaluation manifeste du bien", "Absence de recours à un prêt sans justification", "Réticence à produire les justificatifs", "Compte intermédiaire dans un paradis fiscal", "Profil incohérent avec l'opération"],
    },
  ];
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Cas typologiques réels</h2>
        <p className="text-sm text-gray-500">Exemples concrets d'opérations suspectes détectées par TRACFIN dans le secteur immobilier.</p>
      </div>
      {cas.map((c, i) => (
        <div key={i} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="bg-[#1A3A5C] px-4 py-3">
            <p className="font-bold text-white text-sm">{c.title}</p>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Les faits</p>
              <p className="text-xs text-gray-700 leading-relaxed">{c.faits}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-1">Investigations TRACFIN</p>
              <p className="text-xs text-gray-700 leading-relaxed">{c.investigation}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-2">Critères d'alerte détectés</p>
              <div className="flex flex-wrap gap-1.5">
                {c.criteres.map((cr, j) => (
                  <span key={j} className="text-[10px] font-medium px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-full">{cr}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-4">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-emerald-800">Dans les deux situations, les professionnels qui ont signalé ces opérations suspectes ont permis à TRACFIN de démanteler des schémas de blanchiment. La détection précoce des signaux d'alerte et la déclaration de soupçon sont essentielles.</p>
      </div>
    </div>
  );
}

function DeclarationSection() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Déclaration de soupçon à TRACFIN</h2>
        <p className="text-sm text-gray-500">Lorsque vous identifiez une opération suspecte, vous avez l'obligation légale d'effectuer une déclaration de soupçon auprès de TRACFIN.</p>
      </div>
      <div className="bg-red-600 text-white rounded-xl p-4">
        <p className="font-bold text-sm">CONFIDENTIEL — Obligation légale</p>
        <p className="text-xs text-white/90 mt-1">Ne jamais informer le client qu'une déclaration de soupçon a été effectuée (délit de divulgation, Art. L.561-19 CMF — passible de 22 500 € d'amende).</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm text-gray-900 mb-3">Pourquoi déclarer ?</p>
          <ul className="space-y-1.5">
            {["C'est une obligation légale", "Vous participez à la lutte contre la criminalité", "Vous protégez votre activité professionnelle", "La déclaration vous protège juridiquement"].map((p, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{p}</li>
            ))}
          </ul>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="font-semibold text-sm text-gray-900 mb-3">Vos garanties</p>
          <ul className="space-y-1.5">
            {["Confidentialité absolue garantie", "Protection contre toute poursuite", "Transmission sécurisée via ERMES", "Accompagnement par TRACFIN si besoin"].map((p, i) => (
              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />{p}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="font-semibold text-sm text-gray-900 mb-3">Quand effectuer une déclaration ?</p>
        <ul className="space-y-1.5">
          {["Vous constatez plusieurs critères d'alerte combinés", "Le client refuse de fournir les justificatifs demandés", "L'origine des fonds reste inexpliquée ou douteuse", "Le comportement du client est manifestement suspect", "Vous avez un doute sérieux sur la licéité de l'opération"].map((p, i) => (
            <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A3A5C] mt-1.5 flex-shrink-0" />{p}
            </li>
          ))}
        </ul>
        <div className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
          <p className="text-xs text-amber-800 font-medium">Le soupçon n'a pas besoin d'être une certitude. Si vous avez un doute raisonnable, vous devez déclarer. TRACFIN mènera les investigations approfondies.</p>
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="font-semibold text-sm text-gray-900 mb-3">Que se passe-t-il après la déclaration ?</p>
        <div className="space-y-2">
          {[
            { n: "1", t: "Réception par TRACFIN", d: "Votre déclaration est reçue de manière sécurisée et confidentielle" },
            { n: "2", t: "Analyse approfondie", d: "TRACFIN mène des investigations (comptes bancaires, fiscalité, etc.)" },
            { n: "3", t: "Transmission éventuelle", d: "Si le soupçon est confirmé, transmission au Procureur de la République" },
            { n: "4", t: "Vous êtes protégé", d: "Votre identité reste confidentielle tout au long du processus" },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-[#1A3A5C] text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{step.n}</span>
              <div>
                <p className="text-xs font-semibold text-gray-900">{step.t}</p>
                <p className="text-xs text-gray-500">{step.d}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuideOpSection() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Guide Opérationnel TRACFIN 2025</h2>
        <p className="text-sm text-gray-500">Document de référence officiel pour les professionnels assujettis aux obligations LCB-FT.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-16 bg-[#1A3A5C] rounded-lg flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">L'Obligation de Déclaration TRACFIN</p>
            <p className="text-xs text-gray-500 mt-0.5">Guide Opérationnel LCB-FT pour les Professionnels Assujettis</p>
            <p className="text-xs text-gray-400 mt-1">Cadre légal, détection des signaux faibles et bouclier juridique (Mise à jour 2024/2025)</p>
            <div className="flex gap-3 mt-2">
              {[["Pages", "15"], ["Format", "PDF"], ["Version", "2025"]].map(([k, v]) => (
                <span key={k} className="text-[10px] text-gray-500"><span className="font-semibold text-gray-700">{v}</span> {k}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Contenu du guide</p>
            <ul className="space-y-1">
              {["Le périmètre légal de l'obligation déclarative", "L'approche par les risques et le principe de vigilance", "Signaux d'alerte pour les personnes physiques et morales", "Typologie des opérations suspectes", "Focus sur le secteur immobilier ultra-ciblé", "Le nouveau dispositif de déclaration (2023)", "Le bouclier juridique : immunité du déclarant"].map((p, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A3A5C] mt-1.5 flex-shrink-0" />{p}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">Les 3 réflexes LCB-FT essentiels</p>
            <div className="space-y-2">
              {[
                { n: "IDENTIFIER", d: "Collecter systématiquement les justificatifs avant toute signature et analyser l'origine des fonds" },
                { n: "ANALYSER", d: "Croiser le profil avec la typologie de l'opération pour détecter les incohérences" },
                { n: "DÉCLARER", d: "En cas de doute raisonnable, utiliser le portail TRACFIN pour bénéficier d'une protection légale absolue" },
              ].map((r, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-white bg-[#1A3A5C] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5">{r.n}</span>
                  <p className="text-xs text-gray-600">{r.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500">Ce guide est disponible sur le portail officiel TRACFIN (economie.gouv.fr/tracfin). Conservez-le dans vos archives professionnelles — il peut être présenté lors de contrôles par les autorités compétentes.</p>
        </div>
      </div>
    </div>
  );
}

function FlashcardsSection() {
  const [current, setCurrent] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0 });

  function next() { setCurrent(c => (c + 1) % FLASHCARDS.length); setRevealed(false); }
  function prev() { setCurrent(c => (c - 1 + FLASHCARDS.length) % FLASHCARDS.length); setRevealed(false); }
  function answer(correct: boolean) { setScore(s => ({ ...s, correct: s.correct + (correct ? 1 : 0), wrong: s.wrong + (correct ? 0 : 1) })); next(); }

  const card = FLASHCARDS[current];
  const done = score.correct + score.wrong;
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Flashcards de formation TRACFIN</h2>
          <p className="text-sm text-gray-500 mt-0.5">{FLASHCARDS.length} questions — testez vos connaissances LCB-FT</p>
        </div>
        {done > 0 && (
          <div className="flex gap-2 text-xs">
            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full font-semibold">{score.correct} correctes</span>
            <span className="px-2 py-1 bg-red-100 text-red-600 rounded-full font-semibold">{score.wrong} incorrectes</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
          <div className="bg-[#1A3A5C] h-1.5 rounded-full transition-all" style={{ width: `${((current + 1) / FLASHCARDS.length) * 100}%` }} />
        </div>
        <span className="text-xs text-gray-400 flex-shrink-0">{current + 1} / {FLASHCARDS.length}</span>
      </div>
      <div
        className="bg-white border border-gray-100 rounded-2xl p-6 min-h-48 flex flex-col cursor-pointer select-none"
        onClick={() => setRevealed(r => !r)}>
        <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 mb-3">Question</p>
        <p className="text-sm font-semibold text-gray-900 leading-relaxed flex-1">{card.q}</p>
        {revealed ? (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 mb-2">Réponse</p>
            <p className="text-sm text-gray-700 leading-relaxed">{card.a}</p>
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-gray-400">
            <Eye className="w-4 h-4" />
            <p className="text-xs">Cliquer pour révéler la réponse</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        <button onClick={prev} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ChevronLeft className="w-4 h-4 text-gray-600" />
        </button>
        {revealed ? (
          <div className="flex gap-2 flex-1">
            <button onClick={() => answer(false)} className="flex-1 h-10 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-100 hover:bg-red-100 transition-colors">
              <EyeOff className="w-3.5 h-3.5 inline mr-1" />Je ne savais pas
            </button>
            <button onClick={() => answer(true)} className="flex-1 h-10 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-100 hover:bg-emerald-100 transition-colors">
              <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Je savais
            </button>
          </div>
        ) : (
          <button onClick={() => setRevealed(true)} className="flex-1 h-10 rounded-xl bg-[#1A3A5C] text-white text-xs font-semibold hover:bg-[#15304d] transition-colors">
            Révéler la réponse
          </button>
        )}
        <button onClick={next} className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors">
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </button>
      </div>
      <div className="flex justify-center">
        <button onClick={() => { setCurrent(0); setRevealed(false); setScore({ correct: 0, wrong: 0 }); }}
          className="text-xs text-gray-400 flex items-center gap-1.5 hover:text-gray-600 transition-colors">
          <RotateCcw className="w-3 h-3" />Recommencer
        </button>
      </div>
    </div>
  );
}

function AttestationSection() {
  const [signed, setSigned] = useState(false);
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [checked, setChecked] = useState(false);

  const engagements = [
    "Avoir pris connaissance et compris les obligations légales en matière de LCB-FT applicables aux professionnels de l'immobilier",
    "Avoir étudié les critères d'alerte et les typologies de blanchiment présentés dans cette formation",
    "Avoir compris la cartographie des risques et les différents niveaux de vigilance à appliquer",
    "M'engager à appliquer les mesures de vigilance appropriées lors de chaque transaction immobilière",
    "M'engager à identifier et vérifier l'identité de mes clients ainsi que celle des bénéficiaires effectifs",
    "M'engager à déclarer à TRACFIN toute opération suspecte que je pourrais identifier",
    "M'engager à conserver l'ensemble des documents et informations pendant la durée légale de 5 ans",
    "Comprendre que le non-respect de ces obligations peut entraîner des sanctions administratives et pénales",
  ];

  if (signed) {
    return (
      <div className="space-y-5">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-bold text-emerald-800 text-base">Attestation validée</p>
          <p className="text-sm text-emerald-700 mt-1">Votre engagement a été enregistré de manière sécurisée et immuable.</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-5 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Détails de l'attestation</p>
          {[["Nom complet", name], ["Fonction", role], ["Date et heure", new Date().toLocaleString('fr-FR')], ["Statut", "Signé électroniquement"]].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
              <span className="text-xs text-gray-500">{k}</span>
              <span className="text-xs font-semibold text-gray-900">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-[#1A3A5C]/5 border border-[#1A3A5C]/20 rounded-xl p-4">
          <p className="text-xs text-[#1A3A5C] font-medium">Cette attestation est horodatée, signée électroniquement et enregistrée de manière immuable. Elle constitue une preuve de votre engagement à respecter les procédures LCB-FT et peut être présentée lors de contrôles par les autorités compétentes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Attestation de formation TRACFIN</h2>
        <p className="text-sm text-gray-500">En tant que professionnel assujetti aux obligations LCB-FT, vous devez attester avoir pris connaissance de la formation.</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 font-medium">Une fois signée, cette attestation ne pourra plus être modifiée ni supprimée. Elle sera horodatée et conservée de manière immuable.</p>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <p className="text-xs font-semibold text-gray-700">Engagement de conformité LCB-FT</p>
        <p className="text-xs text-gray-600">Je soussigné(e), certifie par la présente :</p>
        <ul className="space-y-2">
          {engagements.map((e, i) => (
            <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />{e}
            </li>
          ))}
        </ul>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Nom complet *</label>
            <input value={name} onChange={e => setName(e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:ring-1 focus:ring-[#1A3A5C]" placeholder="Prénom Nom" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Fonction *</label>
            <input value={role} onChange={e => setRole(e.target.value)} className="w-full h-9 text-sm border border-gray-200 rounded-lg px-3 outline-none focus:ring-1 focus:ring-[#1A3A5C]" placeholder="Agent immobilier, gestionnaire…" />
          </div>
        </div>
        <label className="flex items-start gap-2 cursor-pointer">
          <input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} className="mt-0.5 w-4 h-4 rounded" />
          <span className="text-xs text-gray-600">J'ai lu et compris l'intégralité de la formation LCB-FT et je m'engage à respecter les obligations réglementaires.</span>
        </label>
        <Button
          onClick={() => setSigned(true)}
          disabled={!name || !role || !checked}
          className="w-full bg-[#1A3A5C] hover:bg-[#15304d] h-10 text-sm">
          <Award className="w-4 h-4 mr-2" />Signer l'attestation
        </Button>
      </div>
    </div>
  );
}

export function TracfinGuide() {
  const [active, setActive] = useState<Section>('overview');

  const sections: Record<Section, React.ReactNode> = {
    overview: <OverviewSection />,
    obligations: <ObligationsSection />,
    alertes: <AlertesSection />,
    cartographie: <CartographieSection />,
    cas: <CasSection />,
    declaration: <DeclarationSection />,
    guide_op: <GuideOpSection />,
    flashcards: <FlashcardsSection />,
    attestation: <AttestationSection />,
  };

  return (
    <AppLayout>
      <Topbar title="Guide LCB-FT" />
      <main className="flex-1 overflow-hidden flex">
        <div className="hidden lg:flex flex-col w-64 flex-shrink-0 border-r border-gray-100 bg-white py-4 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-4 mb-3 flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />Guide LCB-FT
          </p>
          <nav className="space-y-0.5 px-2">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActive(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors ${active === item.id ? 'bg-[#1A3A5C] text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-medium leading-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="lg:hidden flex gap-1 p-3 border-b border-gray-100 overflow-x-auto">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <button key={item.id} onClick={() => setActive(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors ${active === item.id ? 'bg-[#1A3A5C] text-white' : 'bg-gray-100 text-gray-600'}`}>
                  <Icon className="w-3.5 h-3.5" />{item.label}
                </button>
              );
            })}
          </div>
          <div className="p-4 sm:p-6 max-w-3xl">
            {sections[active]}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}